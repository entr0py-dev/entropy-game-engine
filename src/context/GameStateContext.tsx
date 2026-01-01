// PATCH 2: Fixed race conditions, XP consistency, and inventory bugs
// Changes:
// - Consistent XP formula (263 per level)
// - Fixed useModifier to wait for RPC confirmation
// - Improved completeQuest debouncing
// - Optimized handlePongWin logic
// - Added error boundaries

"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";

// --- TYPES ---
export type Profile = {
  id: string;
  username: string;
  avatar?: string | null;
  entrobucks: number;
  gender?: string;
  skin_tone?: string;
  eye_color?: string;
  hair_color?: string;
  hair_style?: string;
  equipped_head?: string | null;
  equipped_face?: string | null;
  equipped_body?: string | null;
  equipped_badge?: string | null;
  equipped_image?: string | null;
  xp: number;
  level: number;
  duplication_expires_at?: string;
};

export type Quest = {
  id: string;
  title: string;
  description?: string;
  reward_entrobucks: number;
  reward_xp: number;
  reward_item?: string | null;
  target_value?: number;
  type?: string;
  is_hidden?: boolean;
};

export type UserQuest = {
  id: string;
  user_id: string;
  quest_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  cost: number;
  image_url: string;
  type: string;
  rarity?: string;
  in_shop?: boolean;
  slot?: string;
};

export type UserItem = {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
  item_details?: Item;
  count?: number;
};

export type CosmeticSet = {
  id: string;
  name: string;
  xp_reward: number;
  is_hidden: boolean;
  items: string[];
};

type WindowType = "none" | "inventory" | "shop" | "quests" | "profile";

type GameState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshGameState: () => Promise<void>;
  addEntrobucks: (amount: number, source?: string) => Promise<void>;
  spendEntrobucks: (amount: number, reason?: string) => Promise<boolean>;
  quests: Quest[];
  userQuests: UserQuest[];
  startQuest: (questId: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  incrementQuest: (questTitle: string, amount?: number) => Promise<void>;
  shopItems: Item[];
  inventory: UserItem[];
  buyItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
  equipItem: (item: Item) => Promise<void>;
  unequipItem: (slot: string) => Promise<void>;
  useModifier: (itemId: string, itemType: string) => Promise<void>;
  cosmeticSets: CosmeticSet[];
  claimedSets: string[];
  claimSetBonus: (setId: string) => Promise<void>;
  activeWindow: WindowType;
  setActiveWindow: (w: WindowType) => void;
  logTransaction: (type: string, amount: number, desc: string, itemName?: string) => Promise<void>;
  handlePongWin: (difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
};

const GameStateContext = createContext<GameState | undefined>(undefined);

// FIXED: Centralized XP formula constant
const XP_PER_LEVEL = 263;

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [cosmeticSets, setCosmeticSets] = useState<CosmeticSet[]>([]);
  const [claimedSets, setClaimedSets] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<WindowType>("none");

  // FIXED: Debounce quest completion to prevent race conditions
  const completingQuests = useRef<Set<string>>(new Set());
  const verifyRewardsTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- LOGGING HELPER ---
  async function logTransaction(type: string, amount: number, desc: string, itemName?: string) {
    if (!session?.user) return;
    try {
      await supabase.from("transactions").insert({
        user_id: session.user.id,
        type, 
        amount,
        description: desc,
        item_name: itemName
      });
    } catch (error) {
      console.error("Transaction log error:", error);
    }
  }

  // --- LOAD GAME STATE ---
  const loadGameState = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;
      setSession(currentSession);

      if (!currentSession) {
        setLoading(false);
        return;
      }

      // Load static data
      const [questsResult, itemsResult, setsResult] = await Promise.all([
        supabase.from("quests").select("*"),
        supabase.from("items").select("*"),
        supabase.from("cosmetic_sets").select("*, set_items(item_id)")
      ]);

      setQuests(questsResult.data || []);
      setShopItems(itemsResult.data?.filter((i) => i.in_shop !== false) || []);

      if (setsResult.data) {
        const formattedSets = setsResult.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          xp_reward: s.xp_reward,
          is_hidden: s.is_hidden,
          items: s.set_items.map((si: any) => si.item_id)
        }));
        setCosmeticSets(formattedSets);
      }

      // Load user-specific data
      if (currentSession?.user) {
        const userId = currentSession.user.id;

        const [profileResult, userQuestResult, claimsResult, inventoryResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("user_quests").select("*").eq("user_id", userId),
          supabase.from("user_set_claims").select("set_id").eq("user_id", userId),
          supabase.from("user_items").select("*").eq("user_id", userId)
        ]);

        setProfile(profileResult.data ? {
          id: profileResult.data.id,
          username: profileResult.data.username,
          avatar: profileResult.data.avatar,
          entrobucks: profileResult.data.entrobucks ?? 0,
          gender: profileResult.data.gender,
          skin_tone: profileResult.data.skin_tone,
          eye_color: profileResult.data.eye_color,
          hair_color: profileResult.data.hair_color,
          hair_style: profileResult.data.hair_style,
          equipped_head: profileResult.data.equipped_head,
          equipped_face: profileResult.data.equipped_image,
          equipped_body: profileResult.data.equipped_body,
          equipped_badge: profileResult.data.equipped_badge,
          equipped_image: profileResult.data.equipped_image,
          xp: profileResult.data.xp ?? 0,
          level: profileResult.data.level ?? 1,
          duplication_expires_at: profileResult.data.duplication_expires_at
        } : null);

        setUserQuests(userQuestResult.data || []);
        setClaimedSets(claimsResult.data?.map((c: any) => c.set_id) || []);

        // Map inventory
        if (inventoryResult.data && itemsResult.data) {
          const simpleInventory = inventoryResult.data.map((row) => {
            const details = itemsResult.data.find(i => i.id === row.item_id);
            return { ...row, item_details: details, count: 1 };
          });
          setInventory(simpleInventory as any);
        } else {
          setInventory([]);
        }
      } else {
        setProfile(null);
        setUserQuests([]);
        setInventory([]);
        setClaimedSets([]);
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
      showToast("Failed to load game data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadGameState();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession); 
        void loadGameState(); 
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setInventory([]);
      }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [loadGameState]); 

  // --- ACTIONS ---
  async function addEntrobucks(amount: number, source = 'system') { 
    if (!session?.user || !profile) return; 
    const newAmount = profile.entrobucks + amount; 
    setProfile({ ...profile, entrobucks: newAmount }); 
    await supabase.from("profiles").update({ entrobucks: newAmount }).eq("id", profile.id); 
    await logTransaction('EARN', amount, `Received from ${source}`); 
  }
  
  async function spendEntrobucks(amount: number, reason = 'purchase'): Promise<boolean> { 
    if (!session?.user || !profile) return false; 
    if (profile.entrobucks < amount) return false; 
    const newAmount = profile.entrobucks - amount; 
    setProfile({ ...profile, entrobucks: newAmount }); 
    await supabase.from("profiles").update({ entrobucks: newAmount }).eq("id", profile.id); 
    await logTransaction('SPEND', -amount, `Spent on ${reason}`); 
    return true; 
  }

  // --- AUTOMATED QUEST CHECKS ---
  useEffect(() => { 
    if (!profile || quests.length === 0 || loading) return; 
    const welcomeQuest = quests.find(q => q.title === "Welcome to the ENTROVERSE"); 
    if (welcomeQuest) { 
      const isDone = userQuests.some(uq => uq.quest_id === welcomeQuest.id && uq.status === 'completed'); 
      if (!isDone) completeQuest(welcomeQuest.id); 
    } 
  }, [profile, quests, userQuests, loading]);

  useEffect(() => { 
    if (loading || !profile || quests.length === 0) return; 
    const checkLevelQuest = async (questTitle: string, levelReq: number) => { 
      if (profile.level >= levelReq) { 
        const quest = quests.find(q => q.title.toLowerCase() === questTitle.toLowerCase()); 
        if (!quest) return; 
        const isDone = userQuests.some(uq => uq.quest_id === quest.id && uq.status === 'completed'); 
        if (!isDone) await completeQuest(quest.id); 
      } 
    }; 
    checkLevelQuest('ENTROPIC NOVICE', 5); 
    checkLevelQuest('ENTROPIC INITIATE', 10); 
    checkLevelQuest('ENTROPIC ADEPT', 15); 
    checkLevelQuest('ENTROPIC EXPLORER', 20); 
  }, [profile?.level, quests, userQuests, loading]);
  
  // FIXED: Debounced verification with delay to prevent false positives
  useEffect(() => {
    if (verifyRewardsTimeout.current) {
      clearTimeout(verifyRewardsTimeout.current);
    }

    verifyRewardsTimeout.current = setTimeout(async () => {
      if (!session?.user || loading || userQuests.length === 0) return;

      // Only verify after state has settled (2 second delay)
      const corruptQuest = quests.find(q => q.title.toUpperCase().includes("CORRUPTED"));
      if (corruptQuest) {
        const isDone = userQuests.some(uq => uq.quest_id === corruptQuest.id && uq.status === 'completed');
        const hasItem = inventory.some(i => i.item_details?.name === "Distorted Amulet");
        
        if (isDone && !hasItem) {
          console.log("FIXING MISSING REWARDS: FILEPATH//.CORRUPTED");
          
          const { data: item } = await supabase.from("items").select("id").eq("name", "Distorted Amulet").maybeSingle();
          if (item) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: item.id });

          await addEntrobucks(350, "Quest Fix: CORRUPTED");
          await supabase.rpc('add_xp', { user_id: session.user.id, amount: 700 });

          await loadGameState();
          showToast("FILEPATH//.CORRUPTED", 'quest', { 
            xp: 700, 
            entrobucks: 350, 
            itemName: "Distorted Amulet", 
            profile: profile 
          });
        }
      }

      const explorerQuest = quests.find(q => q.title === "ENTROPIC EXPLORER");
      if (explorerQuest) {
        const isDone = userQuests.some(uq => uq.quest_id === explorerQuest.id && uq.status === 'completed');
        if (isDone) {
          const hasTop = inventory.some(i => i.item_details?.name === "Gold Top");
          if (!hasTop) {
            const { data: item } = await supabase.from("items").select("id").eq("name", "Gold Top").maybeSingle();
            if (item) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: item.id });
          }
          const hasBadge = inventory.some(i => i.item_details?.name === "Entropic Explorer Badge");
          if (!hasBadge) {
            const { data: item } = await supabase.from("items").select("id").eq("name", "Entropic Explorer Badge").maybeSingle();
            if (item) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: item.id });
          }
        }
      }
    }, 2000); // Wait 2 seconds for state to settle

    return () => {
      if (verifyRewardsTimeout.current) {
        clearTimeout(verifyRewardsTimeout.current);
      }
    };
  }, [loading, userQuests, inventory, session]);

  async function startQuest(questId: string) { 
    if (!session?.user) return; 
    const existing = userQuests.find((q) => q.quest_id === questId); 
    if (existing && existing.status === 'in_progress') return; 
    
    try {
      const { data, error } = await supabase.from("user_quests").insert({ 
        user_id: session.user.id, 
        quest_id: questId, 
        status: "in_progress", 
        progress: 0 
      }).select().single(); 
      
      if (!error && data) { 
        setUserQuests((prev) => [...prev, data]); 
        await logTransaction('QUEST', 0, `Started Quest: ${questId}`); 
        showToast("Mission Started!", "info"); 
      }
    } catch (error) {
      console.error("Failed to start quest:", error);
      showToast("Failed to start quest", "error");
    }
  }
  
  async function completeQuest(questId: string) { 
    if (!session?.user) return;
    
    // FIXED: Prevent duplicate completion
    if (completingQuests.current.has(questId)) {
      console.log("Quest already being completed:", questId);
      return;
    }
    
    completingQuests.current.add(questId);
    
    try {
      const existingLocal = userQuests.find((q) => q.quest_id === questId);
      if (existingLocal?.status === 'completed') {
        completingQuests.current.delete(questId);
        return;
      }

      const quest = quests.find((q) => q.id === questId); 
      if (!quest) {
        completingQuests.current.delete(questId);
        return;
      }
      
      const { data, error } = await supabase.from("user_quests").upsert({ 
        user_id: session.user.id, 
        quest_id: questId, 
        status: "completed", 
        progress: 100, 
        id: existingLocal?.id 
      }, { onConflict: "user_id,quest_id" }).select().single();

      if (!error && data) { 
        setUserQuests((prev) => prev.some((q) => q.quest_id === questId) 
          ? prev.map((q) => (q.quest_id === questId ? { ...q, status: "completed", progress: 100 } : q)) 
          : [...prev, data as UserQuest]
        );
        await logTransaction('QUEST_COMPLETE', 0, `Completed Quest: ${quest.title}`);

        let rewardItemName = undefined;

        // 1. STANDARD REWARD
        if (quest.reward_item) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quest.reward_item);
          let query = supabase.from("items").select("id, name");
          if (isUUID) {
            query = query.eq("id", quest.reward_item);
          } else {
            query = query.eq("name", quest.reward_item);
          }
          const { data: itemData } = await query.maybeSingle();
          
          if (itemData) {
            await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: itemData.id });
            rewardItemName = itemData.name;
          }
        }

        // 2. WELCOME QUEST
        if (quest.title === "Welcome to the ENTROVERSE") {
          const { data: blackTop } = await supabase.from("items").select("id").eq("name", "Default Black Top").maybeSingle();
          if (blackTop) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: blackTop.id });
        }

        // 3. SPECIAL: EXPLORER (Level 20)
        if (quest.title === "ENTROPIC EXPLORER") {
          const { data: goldTop } = await supabase.from("items").select("id, name").eq("name", "Gold Top").maybeSingle();
          if (goldTop) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: goldTop.id });

          const { data: badge } = await supabase.from("items").select("id, name").eq("name", "Entropic Explorer Badge").maybeSingle();
          if (badge) await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: badge.id });

          rewardItemName = "Gold Top & Explorer Badge";
        }

        // 4. SPECIAL: FILEPATH//.CORRUPTED
        if (quest.title.toUpperCase().includes("CORRUPTED")) {
          const { data: amulet } = await supabase.from("items").select("id, name").eq("name", "Distorted Amulet").maybeSingle();
          if (amulet) {
            await supabase.rpc('add_item', { p_user_id: session.user.id, p_item_id: amulet.id });
            rewardItemName = amulet.name;
          }
        }

        // Refresh inventory
        const { data: newInv } = await supabase.from("user_items").select("*, item_details:items(*)").eq("user_id", session.user.id);
        if (newInv) setInventory(newInv as any);

        showToast(quest.title, 'quest', { 
          xp: quest.reward_xp, 
          entrobucks: quest.reward_entrobucks, 
          itemName: rewardItemName, 
          profile: profile 
        });

        if (quest.reward_entrobucks > 0) {
          await addEntrobucks(quest.reward_entrobucks, `Quest Reward: ${quest.title}`);
        }
        
        if (quest.reward_xp > 0) { 
          const { error: xpError } = await supabase.rpc("add_xp", { 
            user_id: session.user.id, 
            amount: quest.reward_xp 
          });
          if (!xpError) await loadGameState(); 
        } 
      }
    } catch (error) {
      console.error("Failed to complete quest:", error);
      showToast("Failed to complete quest", "error");
    } finally {
      completingQuests.current.delete(questId);
    }
  }

  async function incrementQuest(questTitle: string, amount: number = 1) { 
    if (!session?.user) return;
    const questDef = quests.find((q) => q.title === questTitle); 
    if (!questDef) return; 
    const userQuest = userQuests.find((uq) => uq.quest_id === questDef.id);
    if (!userQuest || userQuest.status === "completed") return; 
    
    const newProgress = (userQuest.progress || 0) + amount;
    const target = (questDef as any).target_value || 1; 
    
    if (newProgress >= target) {
      await completeQuest(questDef.id);
    } else { 
      try {
        const { error } = await supabase.from("user_quests").update({ progress: newProgress }).eq("id", userQuest.id);
        if (!error) {
          setUserQuests((prev) => prev.map((uq) => uq.id === userQuest.id ? { ...uq, progress: newProgress } : uq));
        }
      } catch (error) {
        console.error("Failed to increment quest:", error);
      }
    } 
  }

  async function buyItem(itemId: string): Promise<{ success: boolean; message: string }> { 
    if (!session?.user || !profile) return { success: false, message: "Not logged in" };
    
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return { success: false, message: "Item not found" };
    if (profile.entrobucks < item.cost) return { success: false, message: "Insufficient Entrobucks" };
    
    const alreadyOwns = inventory.some(i => i.item_id === itemId);
    if (alreadyOwns) return { success: false, message: "You already own this item" };

    const paid = await spendEntrobucks(item.cost, `Purchased ${item.name}`);
    if (!paid) return { success: false, message: "Payment failed" };

    try {
      const { data, error } = await supabase.from("user_items").insert({ 
        user_id: session.user.id, 
        item_id: itemId 
      }).select().single();
      
      if (error || !data) {
        // Refund on failure
        await addEntrobucks(item.cost, "Purchase failed - refund");
        return { success: false, message: "Database error: " + error?.message };
      }

      await logTransaction('PURCHASE', -item.cost, `Bought Item`, item.name);
      await loadGameState();
      return { success: true, message: `Purchased ${item.name}!` };
    } catch (error) {
      console.error("Purchase failed:", error);
      await addEntrobucks(item.cost, "Purchase failed - refund");
      return { success: false, message: "Purchase failed" };
    }
  }

  // FIXED: Wait for RPC confirmation before removing from inventory
  async function useModifier(itemId: string, itemName: string) {
    if (!session?.user || !profile) return;
    
    const lowerName = itemName.toLowerCase();
    const isDuplicationGlitch = lowerName.includes('duplication') || lowerName.includes('glitch');
    const isDie = lowerName.includes('die') || lowerName.includes('12');
    
    if (isDuplicationGlitch || isDie) {
      try {
        // First, activate the modifier on the backend
        const { error } = await supabase.rpc('use_duplication_glitch', { 
          p_user_id: session.user.id, 
          p_item_id: itemId 
        });
        
        if (error) {
          showToast("Failed to activate modifier", "error");
          console.error("RPC Error:", error);
          return;
        }
        
        // Only update state after successful RPC
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);
        
        setProfile(prev => prev ? { 
          ...prev, 
          duplication_expires_at: expiry.toISOString() 
        } : null);
        
        // Remove from inventory
        setInventory((prev) => prev.filter(i => i.item_id !== itemId));
        
        if (window.top) {
          window.top.postMessage({ 
            type: 'SHOW_TOAST', 
            payload: { 
              message: "SYSTEM HACK: 2X ACTIVE", 
              toastType: "info" 
            } 
          }, '*');
        }
        
        showToast("2X Multiplier Active (15 min)", "success");
      } catch (error) {
        console.error("Modifier activation failed:", error);
        showToast("Modifier activation failed", "error");
      }
    }
  }

  // FIXED: Check ownership before rolling to avoid wasted RNG
  async function handlePongWin(difficulty: 'easy' | 'medium' | 'hard') {
    if (!session?.user || !profile) return;

    const targetItemName = difficulty === 'hard' ? '8balls top hat' : '8balls moustache';
    
    // FIXED: Check ownership FIRST
    const owned = inventory.some(i => i.item_details?.name.toLowerCase() === targetItemName.toLowerCase());
    if (owned) {
      console.log("Player already owns", targetItemName);
      return;
    }

    // Now roll for drop
    let dropChance = 0.2; 
    if (profile.duplication_expires_at && new Date(profile.duplication_expires_at) > new Date()) {
      dropChance = 0.4;
    }

    console.log(`Rolling for drop... Chance: ${dropChance}`);

    if (Math.random() > dropChance) return;

    // Grant item
    try {
      const { data: itemData } = await supabase.from('items').select('id, name').ilike('name', targetItemName).maybeSingle();
      if (itemData) {
        const { error } = await supabase.rpc('add_item', { 
          p_user_id: session.user.id, 
          p_item_id: itemData.id 
        });
        
        if (!error) {
          await loadGameState();
          showToast(`UNLOCKED RARE ITEM: ${itemData.name}`, 'success', { 
            itemName: itemData.name, 
            profile 
          });
        }
      }
    } catch (error) {
      console.error("Failed to grant Pong drop:", error);
    }
  }

  async function equipItem(item: Item) {
    if (!session?.user || !profile) return;
    
    try {
      const updates: any = {};
      const slot = item.slot || 'face';
      
      if (slot === 'badge') updates.equipped_badge = item.name; 
      else if (slot === 'head') updates.equipped_head = item.name;
      else if (slot === 'body') updates.equipped_body = item.name;
      else { 
        updates.equipped_image = item.name; 
        updates.equipped_face = item.name; 
      }

      setProfile({ ...profile, ...updates });
      await supabase.from("profiles").update(updates).eq("id", profile.id);
      showToast(`Equipped ${item.name}`, "info");
    } catch (error) {
      console.error("Failed to equip item:", error);
      showToast("Failed to equip item", "error");
    }
  }

  async function unequipItem(slot: string) {
    if (!session?.user || !profile) return;
    
    try {
      const updates: any = {};
      
      if (slot === "head") updates.equipped_head = null;
      else if (slot === "face") updates.equipped_image = null; 
      else if (slot === "badge") updates.equipped_badge = null;
      else if (slot === "body") updates.equipped_body = null;
      
      if (Object
