/**
 * Generated from supabase/migrations via local embedded Postgres + `supabase gen types`.
 * Do not edit by hand. Domain constants (HANGOVER_*) live in src/types/domain.ts.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      auth_attempts: {
        Row: {
          created_at: string;
          id: number;
          key_hash: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: number;
          key_hash: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          key_hash?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_entries: {
        Row: {
          challenge_id: string;
          cocktail_variation_id: string | null;
          created_at: string;
          id: string;
          meme_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_id: string;
          cocktail_variation_id?: string | null;
          created_at?: string;
          id?: string;
          meme_id?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          cocktail_variation_id?: string | null;
          created_at?: string;
          id?: string;
          meme_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_entries_cocktail_variation_id_fkey";
            columns: ["cocktail_variation_id"];
            isOneToOne: false;
            referencedRelation: "cocktail_variations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_entries_meme_id_fkey";
            columns: ["meme_id"];
            isOneToOne: false;
            referencedRelation: "memes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_votes: {
        Row: {
          challenge_id: string;
          created_at: string;
          entry_id: string;
          voter_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_id: string;
          created_at?: string;
          entry_id: string;
          voter_id: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string;
          entry_id?: string;
          voter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_votes_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_votes_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "challenge_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_default: boolean;
          kind: string;
          starts_on: string;
          theme: string;
          winner_notified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          kind: string;
          starts_on: string;
          theme: string;
          winner_notified_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          kind?: string;
          starts_on?: string;
          theme?: string;
          winner_notified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cocktail_variations: {
        Row: {
          author_id: string;
          cocktail_id: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          is_hidden: boolean;
          rules: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          cocktail_id: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
          rules: string;
          title: string;
        };
        Update: {
          author_id?: string;
          cocktail_id?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
          rules?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cocktail_variations_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cocktail_variations_cocktail_id_fkey";
            columns: ["cocktail_id"];
            isOneToOne: false;
            referencedRelation: "cocktails";
            referencedColumns: ["id"];
          },
        ];
      };
      cocktails: {
        Row: {
          author_id: string | null;
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          ingredients: NonNullable<Json>;
          is_alcohol_free: boolean;
          is_hidden: boolean;
          method: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          image_url?: string | null;
          ingredients?: NonNullable<Json>;
          is_alcohol_free?: boolean;
          is_hidden?: boolean;
          method: string;
          name: string;
        };
        Update: {
          author_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          ingredients?: NonNullable<Json>;
          is_alcohol_free?: boolean;
          is_hidden?: boolean;
          method?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cocktails_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          cocktail_id: string | null;
          created_at: string;
          edited_at: string | null;
          game_id: string | null;
          id: string;
          is_hidden: boolean;
          meme_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          cocktail_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          game_id?: string | null;
          id?: string;
          is_hidden?: boolean;
          meme_id?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          cocktail_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          game_id?: string | null;
          id?: string;
          is_hidden?: boolean;
          meme_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_cocktail_id_fkey";
            columns: ["cocktail_id"];
            isOneToOne: false;
            referencedRelation: "cocktails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_meme_id_fkey";
            columns: ["meme_id"];
            isOneToOne: false;
            referencedRelation: "memes";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_variations: {
        Row: {
          author_id: string;
          created_at: string;
          edited_at: string | null;
          game_id: string;
          id: string;
          is_hidden: boolean;
          rules: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          created_at?: string;
          edited_at?: string | null;
          game_id: string;
          id?: string;
          is_hidden?: boolean;
          rules: string;
          title: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          edited_at?: string | null;
          game_id?: string;
          id?: string;
          is_hidden?: boolean;
          rules?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_variations_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_variations_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          author_id: string;
          cover_image_url: string | null;
          created_at: string;
          equipment: string[];
          hangover_rating: Database["public"]["Enums"]["hangover_rating"];
          id: string;
          is_hidden: boolean;
          max_players: number | null;
          min_players: number;
          rules: string;
          search: unknown;
          slug: string;
          summary: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          cover_image_url?: string | null;
          created_at?: string;
          equipment?: string[];
          hangover_rating: Database["public"]["Enums"]["hangover_rating"];
          id?: string;
          is_hidden?: boolean;
          max_players?: number | null;
          min_players?: number;
          rules: string;
          search?: never;
          slug: string;
          summary: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          cover_image_url?: string | null;
          created_at?: string;
          equipment?: string[];
          hangover_rating?: Database["public"]["Enums"]["hangover_rating"];
          id?: string;
          is_hidden?: boolean;
          max_players?: number | null;
          min_players?: number;
          rules?: string;
          search?: never;
          slug?: string;
          summary?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meme_reactions: {
        Row: {
          created_at: string;
          emoji: string;
          meme_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          emoji: string;
          meme_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          meme_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meme_reactions_meme_id_fkey";
            columns: ["meme_id"];
            isOneToOne: false;
            referencedRelation: "memes";
            referencedColumns: ["id"];
          },
        ];
      };
      memes: {
        Row: {
          author_id: string;
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string | null;
          is_hidden: boolean;
          joke_text: string | null;
          reaction_count: number;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_hidden?: boolean;
          joke_text?: string | null;
          reaction_count?: number;
        };
        Update: {
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_hidden?: boolean;
          joke_text?: string | null;
          reaction_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "memes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_notices: {
        Row: {
          author_id: string | null;
          created_at: string;
          explanation: string | null;
          id: string;
          preview: string | null;
          reason: string;
          reversed_at: string | null;
          target_id: string;
          target_type: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          preview?: string | null;
          reason: string;
          reversed_at?: string | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          author_id?: string | null;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          preview?: string | null;
          reason?: string;
          reversed_at?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_notices_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          count: number;
          created_at: string;
          id: string;
          kind: string;
          preview: string | null;
          read_at: string | null;
          target_id: string;
          target_type: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          count?: number;
          created_at?: string;
          id?: string;
          kind: string;
          preview?: string | null;
          read_at?: string | null;
          target_id: string;
          target_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          count?: number;
          created_at?: string;
          id?: string;
          kind?: string;
          preview?: string | null;
          read_at?: string | null;
          target_id?: string;
          target_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          accepted_terms_at: string | null;
          accepted_terms_version: string | null;
          age_confirmed_at: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string;
          display_name: string | null;
          favourite_drink: string | null;
          id: string;
          is_admin: boolean;
          party_vibe: string | null;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_terms_at?: string | null;
          accepted_terms_version?: string | null;
          age_confirmed_at: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth: string;
          display_name?: string | null;
          favourite_drink?: string | null;
          id: string;
          is_admin?: boolean;
          party_vibe?: string | null;
          username: string;
        };
        Update: {
          accepted_terms_at?: string | null;
          accepted_terms_version?: string | null;
          age_confirmed_at?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string;
          display_name?: string | null;
          favourite_drink?: string | null;
          id?: string;
          is_admin?: boolean;
          party_vibe?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          cocktail_id: string | null;
          created_at: string;
          game_id: string | null;
          id: string;
          score: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cocktail_id?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          score: number;
          user_id: string;
        };
        Update: {
          cocktail_id?: string | null;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_cocktail_id_fkey";
            columns: ["cocktail_id"];
            isOneToOne: false;
            referencedRelation: "cocktails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reaction_rate: {
        Row: {
          n: number;
          user_id: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          n?: number;
          user_id: string;
          window_start?: string;
        };
        Update: {
          n?: number;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          decided_at: string | null;
          id: string;
          note: string | null;
          outcome: string | null;
          reason: string;
          reporter_email: string | null;
          reporter_id: string | null;
          status: string;
          target_id: string | null;
          target_type: string;
          target_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          note?: string | null;
          outcome?: string | null;
          reason: string;
          reporter_email?: string | null;
          reporter_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_type: string;
          target_url?: string | null;
        };
        Update: {
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          note?: string | null;
          outcome?: string | null;
          reason?: string;
          reporter_email?: string | null;
          reporter_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_type?: string;
          target_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_terms: { Args: { p_version: string }; Returns: string };
      auth_throttle_fail: {
        Args: { p_keys: string[]; p_secret: string };
        Returns: undefined;
      };
      auth_throttle_ok: {
        Args: { p_keys: string[]; p_secret: string };
        Returns: boolean;
      };
      blocked_by: { Args: { p_owner: string }; Returns: boolean };
      challenge_board: {
        Args: { p_challenge: string };
        Returns: {
          avatar_url: string;
          can_vote: boolean;
          cocktail_id: string;
          cocktail_name: string;
          created_at: string;
          display_name: string;
          entry_id: string;
          meme_caption: string;
          meme_id: string;
          meme_image_url: string;
          meme_joke: string;
          my_vote: boolean;
          user_id: string;
          username: string;
          variation_id: string;
          variation_rules: string;
          variation_title: string;
          votes: number;
        }[];
      };
      challenge_ends_at: { Args: { p_starts_on: string }; Returns: string };
      challenge_week_start: { Args: { p_at?: string }; Returns: string };
      challenge_winner: {
        Args: { p_challenge: string };
        Returns: {
          entry_id: string;
          user_id: string;
          username: string;
          votes: number;
        }[];
      };
      current_challenge: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_default: boolean;
          kind: string;
          starts_on: string;
          theme: string;
          winner_notified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "challenges";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      dearmor: { Args: { "": string }; Returns: string };
      delete_my_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      enter_challenge: {
        Args: { p_challenge: string; p_submission: string };
        Returns: string;
      };
      feed_cocktails: {
        Args: {
          alcohol_free?: boolean;
          ing?: string | null;
          max_rows?: number;
          q?: string | null;
          sort?: string;
        };
        Returns: {
          avg_rating: number;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          is_alcohol_free: boolean;
          name: string;
          rating_count: number;
        }[];
      };
      feed_games: {
        Args: {
          hangover?: Database["public"]["Enums"]["hangover_rating"] | null;
          max_rows?: number;
          q?: string | null;
          sort?: string;
        };
        Returns: {
          avg_rating: number;
          created_at: string;
          hangover_rating: Database["public"]["Enums"]["hangover_rating"];
          id: string;
          min_players: number;
          rating_count: number;
          summary: string;
          tags: string[];
          title: string;
        }[];
      };
      fips_mode: { Args: Record<PropertyKey, never>; Returns: boolean };
      follow_counts: {
        Args: { p_user: string };
        Returns: {
          followers: number;
          following: number;
        }[];
      };
      following_feed_games: {
        Args: { max_rows?: number };
        Returns: {
          avg_rating: number;
          created_at: string;
          hangover_rating: Database["public"]["Enums"]["hangover_rating"];
          id: string;
          min_players: number;
          rating_count: number;
          summary: string;
          tags: string[];
          title: string;
        }[];
      };
      following_meme_ids: { Args: { max_rows?: number }; Returns: string[] };
      gen_random_uuid: { Args: Record<PropertyKey, never>; Returns: string };
      gen_salt: { Args: { "": string }; Returns: string };
      grant_upload: {
        Args: {
          p_bucket: string;
          p_bytes: number;
          p_name: string;
          p_secret: string;
        };
        Returns: undefined;
      };
      i_block: { Args: { p_user: string }; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      mark_notifications_read: {
        Args: { p_ids?: string[] | null };
        Returns: undefined;
      };
      meme_stats: {
        Args: { p_ids: string[] };
        Returns: {
          comment_count: number;
          meme_id: string;
          mine: string;
          reactions: Json;
        }[];
      };
      meme_visible: { Args: { p_meme: string }; Returns: boolean };
      my_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          accepted_terms_at: string | null;
          accepted_terms_version: string | null;
          age_confirmed_at: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string;
          display_name: string | null;
          favourite_drink: string | null;
          id: string;
          is_admin: boolean;
          party_vibe: string | null;
          username: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      my_terms_version: { Args: Record<PropertyKey, never>; Returns: string };
      orphan_media: {
        Args: { p_min_age?: string };
        Returns: {
          bucket_id: string;
          created_at: string;
          name: string;
        }[];
      };
      parent_author: {
        Args: { p_cocktail: string; p_game: string; p_meme: string };
        Returns: string;
      };
      parent_readable: {
        Args: { p_cocktail: string; p_game: string; p_meme: string };
        Returns: boolean;
      };
      parent_visible:
        | { Args: { p_cocktail: string; p_game: string }; Returns: boolean }
        | {
            Args: { p_cocktail: string; p_game: string; p_meme: string };
            Returns: boolean;
          };
      pgp_armor_headers: {
        Args: { "": string };
        Returns: Record<string, unknown>[];
      };
      profile_reaction_totals: {
        Args: { p_user: string };
        Returns: {
          emoji: string;
          n: number;
        }[];
      };
      rating_summary: {
        Args: { p_cocktail?: string; p_game?: string };
        Returns: {
          avg_score: number;
          rating_count: number;
        }[];
      };
      set_challenge_vote: {
        Args: { p_challenge: string; p_entry: string | null };
        Returns: Json;
      };
      set_reaction: {
        Args: { p_emoji: string | null; p_meme: string };
        Returns: Json;
      };
      submit_public_report: {
        Args: {
          p_email: string | null;
          p_note: string;
          p_reason: string;
          p_secret: string;
          p_target_id: string | null;
          p_target_type: string;
          p_target_url: string | null;
        };
        Returns: string;
      };
      top_memes: {
        Args: { p_limit?: number; p_offset?: number; p_since?: string | null };
        Returns: {
          id: string;
          reaction_count: number;
        }[];
      };
      unread_notification_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      upload_granted: {
        Args: { p_bucket: string; p_name: string };
        Returns: boolean;
      };
      user_challenge_wins: {
        Args: { p_user: string };
        Returns: {
          challenge_id: string;
          starts_on: string;
          theme: string;
          votes: number;
        }[];
      };
      withdraw_challenge_entry: {
        Args: { p_challenge: string };
        Returns: undefined;
      };
    };
    Enums: {
      hangover_rating: "no_hangover" | "mild_hangover" | "two_day_hangover";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      hangover_rating: ["no_hangover", "mild_hangover", "two_day_hangover"],
    },
  },
} as const;
