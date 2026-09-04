export interface UserProfile {
	id: number;
	email: string;
	role: 'super_admin' | 'club_admin' | 'student';
	club_id?: number | string;
}

export interface Club {
  id: string | number;
  name: string;
  code: string;
  category?: string;
  signature?: string;
  description?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  facebook_url?: string | null;
  contact_email?: string | null;
  is_active?: boolean;
  followers_count?: number;
  admin_id: string;
}

export interface PostData {
  id: number | string;
  title: string;
  content?: string;
  club_id?: number | string;
  club_name?: string;
  club_logo?: string;
  created_at: string;
  action_url?: string | null;
  deadline?:string;
  email_message?:string;
  image_url?: string | null;
  is_following?: boolean;
  type?: 'POST' | 'EVENT' | string;
  club?: {
    id?: number | string;
    name?: string;
    logo_url?: string;
    category?:string | null;
  };
}

export type Post = PostData;