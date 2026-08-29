import ClubDetailClient from './ClubDetailClient';

export const runtime = 'edge';

interface PageProps {
	params: {
		id: string;
	};
}

export default function ClubPage({ params }: PageProps) {
	return <ClubDetailClient clubId={params.id} />;
}