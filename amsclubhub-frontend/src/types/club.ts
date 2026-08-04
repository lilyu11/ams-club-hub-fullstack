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

export interface Post {
  id: string | number;
  title: string;
  content: string;
  image_url?: string | null;
  created_at?: string;
  club_id?: string | number; 
  type?: string;
  application_form_url?: string | null;
  club?: {
    name: string;
    logo_url: string;
  };
}