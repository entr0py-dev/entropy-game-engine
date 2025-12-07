"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";

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
  buyItem: (itemId: string) => Promise<void>;
  equipItem: (item: Item) => Promise<void>;
  unequipItem: (slot: string) => Promise<void>;
  cosmeticSets: CosmeticSet[];
  claimedSets: string[];
  claimSetBonus: (setId: string) => Promise<void>;
  activeWindow: WindowType;
  setActiveWindow: (w: WindowType) => void;
  logTransaction: (type: string, amount: number, desc: string, itemName?: string) => Promise<void>;
};

const GameStateContext = createContext<GameState | undefined>(undefined);

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

  // --- LOGGING HELPER ---
  async function logTransaction(type: string, amount: number, desc: string, itemName?: string) {
    if (!session?.user) return;
    supabase.from("transactions").insert({
        user_id: session.user.id,
        type, 
        amount,
        description: desc,
        item_name: itemName
    }).then(({ error }) => {
        if (error) console.error("Log Error:", error);
    });
  }

  const loadGameState = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session;
    setSession(currentSession);

    const { data: questsData } = await supabase.from("quests").select("*");
    setQuests(questsData || []);

    const { data: itemsData } = await supabase.from("items").select("*");
    setShopItems(itemsData?.filter((i) => i.in_shop !== false) || []);

    const { data: setsData } = await supabase.from("cosmetic_sets").select("*, set_items(item_id)");
    if (setsData) {
        const formattedSets = setsData.map((s: any) => ({
            id: s.id,
            name: s.name,
            xp_reward: s.xp_reward,
            is_hidden: s.is_hidden,
            items: s.set_items.map((si: any) => si.item_id)
        }));
        setCosmeticSets(formattedSets);
    }

    if (currentSession?.user) {
      const userId = currentSession.user.id;

      const { data: claimsData } = await supabase.from("user_set_claims").select("set_id").eq("user_id", userId);
      if (claimsData) setClaimedSets(claimsData.map((c: any) => c.set_id));

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfile(profileData ? {
          id: profileData.id,
          username: profileData.username,
          avatar: profileData.avatar,
          entrobucks: profileData.entrobucks ?? 0,
          gender: profileData.gender,
          skin_tone: profileData.skin_tone,
          eye_color: profileData.eye_color,
          hair_color: profileData.hair_color,
          hair_style: profileData.hair_style,
          equipped_image: profileData.equipped_image,
          equipped_face: profileData.equipped_image,
          equipped_badge: profileData.equipped_badge,
          equipped_head: profileData.equipped_head,
          equipped_body: profileData.equipped_body,
          xp: profileData.xp ?? 0,
          level: profileData.level ?? 1,
      } : null);

      const { data: userQuestData } = await supabase.from("user_quests").select("*").eq("user_id", userId);
      setUserQuests(userQuestData || []);

      const { data: rawInventory } = await supabase.from("user_items").select("*").eq("user_id", userId);
      
      if (rawInventory && itemsData) {
        const groupedMap = new Map<string, UserItem>();
        rawInventory.forEach((row) => {
            const details = itemsData.find(i => i.id === row.item_id);
            if (!details) return;
            if (details.type === 'modifier') {
                if (groupedMap.has(details.id)) {
                    const existing = groupedMap.get(details.id)!;
                    existing.count = (existing.count || 1) + 1;
                } else {
                    groupedMap.set(details.id, { ...row, item_details: details, count: 1 });
                }
            } else {
                groupedMap.set(row.id, { ...row, item_details: details, count: 1 });
            }
        });
        setInventory(Array.from(groupedMap.values()));
      } else {
        setInventory([]);
      }
    } else {
      setProfile(null); setUserQuests([]); setInventory([]); setClaimedSets([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadGameState();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => { setSession(newSession); void loadGameState(); });
    return () => { authListener.subscription.unsubscribe(); };
  }, [loadGameState]);

  async function addEntrobucks(amount: number, source = 'system') {
    if (!session?.user || !profile) return;
    const newAmount = profile.entrobucks + amount;
    setProfile({ ...profile, entrobucks: newAmount });
    await supabase.from("profiles").update({ entrobucks: newAmount }).eq("id", profile.id);
    logTransaction('EARN', amount, `Received from ${source}`);
  }

  async function spendEntrobucks(amount: number, reason = 'purchase'): Promise<boolean> {
    if (!session?.user || !profile) return false;
    if (profile.entrobucks < amount) return false;
    const newAmount = profile.entrobucks - amount;
    setProfile({ ...profile, entrobucks: newAmount });
    await supabase.from("profiles").update({ entrobucks: newAmount }).eq("id", profile.id);
    logTransaction('SPEND', -amount, `Spent on ${reason}`);
    return true;
  }

  async function startQuest(questId: string) {
    if (!session?.user) return;
    const existing = userQuests.find((q) => q.quest_id === questId);
    if (existing && existing.status === 'in_progress') return;
    const { data, error } = await supabase.from("user_quests").insert({ user_id: session.user.id, quest_id: questId, status: "in_progress", progress: 0 }).select().single();
    if (!error && data) {
        setUserQuests((prev) => [...prev, data]);
        logTransaction('QUEST', 0, `Started Quest: ${questId}`);
        showToast("Mission Started!", "info");
    }
  }
  
  async function completeQuest(questId: string) { 
    if (!session?.user) return;
    const quest = quests.find((q) => q.id === questId); 
    if (!quest) return; 
    
    const existing = userQuests.find((q) => q.quest_id === questId);
    
    const { data, error } = await supabase
        .from("user_quests")
        .upsert({ 
            user_id: session.user.id, 
            quest_id: questId, 
            status: "completed", 
            progress: 100, 
            id: existing?.id 
        }, { onConflict: "user_id,quest_id" })
        .select()
        .single();

    if (!error && data) { 
        setUserQuests((prev) => 
            prev.some((q) => q.quest_id === questId) 
                ? prev.map((q) => (q.quest_id === questId ? { ...q, status: "completed", progress: 100 } : q)) 
                : [...prev, data as UserQuest] 
        );
        
        logTransaction('QUEST_COMPLETE', 0, `Completed Quest: ${quest.title}`);

        // --- NEW: FETCH ITEM NAME FOR TOAST ---
        let rewardItemName = undefined;
        if (quest.reward_item) {
             // If reward_item is a UUID, we might need to find the name. 
             // If it's stored as a name string in DB (as per our previous fix), we use it directly.
             // We check the shopItems array to see if we can find a pretty name.
             const shopItem = shopItems.find(i => i.id === quest.reward_item || i.name === quest.reward_item);
             rewardItemName = shopItem ? shopItem.name : quest.reward_item;
        }

        // --- TRIGGER EXCITING TOAST ---
        showToast(quest.title, 'quest', {
            xp: quest.reward_xp,
            entrobucks: quest.reward_entrobucks,
            itemName: rewardItemName,
            profile: profile // Pass profile so Avatar preview renders correctly
        });

        if (quest.reward_entrobucks > 0) {
            await addEntrobucks(quest.reward_entrobucks, `Quest Reward: ${quest.title}`);
        } 
        
        if (quest.reward_xp > 0) { 
            const { error: xpError } = await supabase.rpc("add_xp", { user_id: session.user.id, amount: quest.reward_xp });
            if (!xpError) await loadGameState(); 
        } 
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
          const { error } = await supabase.from("user_quests").update({ progress: newProgress }).eq("id", userQuest.id);
          if (!error) { 
              setUserQuests((prev) => prev.map((uq) => uq.id === userQuest.id ? { ...uq, progress: newProgress } : uq));
          } 
      } 
  }

  async function buyItem(itemId: string) {
    if (!session?.user || !profile) { showToast("Not logged in", "error"); return; }
    const item = shopItems.find(i => i.id === itemId);
    if (!item) { showToast("Item not found", "error"); return; }
    if (profile.entrobucks < item.cost) { showToast("Insufficient Entrobucks", "error"); return; }
    
    const alreadyOwns = inventory.some(i => i.item_id === itemId);
    if (alreadyOwns && item.type !== "modifier") { showToast("Already owned!", "info"); return; }
    
    const paid = await spendEntrobucks(item.cost, `Purchased ${item.name}`);
    if (!paid) { showToast("Payment failed", "error"); return; }
    // Use the RPC function to handle stacking automatically
    const { error } = await supabase.rpc('add_item', { 
        p_user_id: session.user.id, 
        p_item_id: itemId 
    });
    if (error) { showToast("Database Error", "error"); return; }
    logTransaction('PURCHASE', -item.cost, `Bought Item`, item.name);

    await loadGameState();
    showToast(`Purchased ${item.name}!`, "success");
  }

  async function equipItem(item: Item) {
    if (!session?.user || !profile) return;
    const updates: any = {};
    const slot = item.slot || 'face';

    // FIX: Save the item NAME for badges/modifiers so Avatar.tsx can match keywords.
    // Previously it saved item.image_url, which was just an emoji.
    if (slot === 'badge') updates.equipped_badge = item.name; 
    else if (slot === 'head') updates.equipped_head = item.name;
    else if (slot === 'body') updates.equipped_body = item.name;
    else { updates.equipped_image = item.name; updates.equipped_face = item.name; }

    setProfile({ ...profile, ...updates });
    await supabase.from("profiles").update(updates).eq("id", profile.id);
    showToast(`Equipped ${item.name}`, "info");
  }

  async function unequipItem(slot: string) {
    if (!session?.user || !profile) return;
    const updates: any = {};
    if (slot === "head") updates.equipped_head = null;
    else if (slot === "face") updates.equipped_image = null;
    else if (slot === "badge") updates.equipped_badge = null;
    else if (slot === "body") updates.equipped_body = null;
    if (Object.keys(updates).length === 0) return;
    setProfile({ ...profile, ...updates });
    await supabase.from("profiles").update(updates).eq("id", profile.id);
    showToast(`Unequipped item`, "info");
  }

  // --- SETS LOGIC ---
  async function claimSetBonus(setId: string) {
    if (!session?.user || !profile) return;
    
    const set = cosmeticSets.find(s => s.id === setId);
    if (!set) return;
    if (claimedSets.includes(setId)) {
        showToast("You have already claimed this set!", "info");
        return;
    }

    // Check ownership
    const ownedItemIds = inventory.map(i => i.item_id);
    const hasAll = set.items.every(reqId => ownedItemIds.includes(reqId));
    
    if (!hasAll) {
        showToast("You don't have all items in this set!", "error");
        return;
    }

    // 1. Claim in DB
    const { error: claimError } = await supabase.from("user_set_claims").insert({
        user_id: session.user.id,
        set_id: setId
    });

    if (claimError) {
        console.error("Claim Error:", claimError);
        showToast("Error claiming set", "error");
        return;
    }

    // 2. Award XP (Check for RPC errors)
    const { error: xpError } = await supabase.rpc("add_xp", { 
        user_id: session.user.id, 
        amount: set.xp_reward 
    });

    if (xpError) {
        console.error("XP Error:", xpError);
        showToast("Set claimed, but XP failed. Contact support.", "error");
    } else {
        // 3. Update Local State Immediately
        setClaimedSets(prev => [...prev, setId]);
        
        // Optimistic XP Update (so bar moves instantly)
        const newXp = (profile.xp || 0) + set.xp_reward;
        setProfile({ ...profile, xp: newXp }); 

        await loadGameState(); // Fetch true level/xp from DB
        showToast(`SET COMPLETED! +${set.xp_reward} XP`, "success");
    }
  }

  return (
    <GameStateContext.Provider
      value={{
        session, profile, loading, refreshGameState: loadGameState,
        addEntrobucks, spendEntrobucks, quests, userQuests, startQuest, completeQuest, incrementQuest,
        shopItems, inventory, buyItem, equipItem, unequipItem,
        cosmeticSets, claimedSets, claimSetBonus,
        activeWindow, setActiveWindow, logTransaction
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within a GameStateProvider");
  return ctx;
}
