import PostDetailPage from './PostDetailPage';

export const dynamic = 'force-dynamic'

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function ClubPage({ params }: PageProps) {
	const resolvedParams = await params;
	return <PostDetailPage postId={resolvedParams.id} />;
}
