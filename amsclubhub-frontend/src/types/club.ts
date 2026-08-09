export interface UserProfile {
	id: number;
	email: string;
	role: 'super_admin' | 'club_admin' | 'admin' | 'student';
	club_id?: number | string;
}

export interface ClubDetail {
	id: number | string;
	name: string;
	code: string;
	description: string;
	category?: string;
	logo_url?: string;
	banner_url?: string;
	facebook_url?: string;
	contact_email?: string;
}

export interface PostData {
  id: number | string;
  title: string;
  content?: string;                  // Thêm dấu ? để cho phép undefined/null
  club_id?: number | string;         // Cho phép cả string lẫn number
  club_name?: string;
  club_logo?: string;
  created_at: string;
  action_url?: string | null;
  image_url?: string | null;
  is_following?: boolean;
  club?: {
    id?: number | string;
    name?: string;
    logo_url?: string;
  };
}

export type Post = PostData;