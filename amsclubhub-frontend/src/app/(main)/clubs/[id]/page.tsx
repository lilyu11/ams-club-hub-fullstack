import ClubDetailPage from './ClubDetailPage';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function ClubPage({ params }: PageProps) {
	const resolvedParams = await params;
	return <ClubDetailPage clubId={resolvedParams.id} />;
}