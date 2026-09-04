export interface Character {
  id: number;
  name: string;
  slug: string;
  title: string;
  system_prompt: string;
  avatar: string | null;
  voice_sample: string | null;
  is_active: boolean;
}