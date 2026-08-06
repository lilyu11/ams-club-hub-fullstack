import BriefProfileWidget from './widgets/BriefProfileWidget';
import LatestPostsWidget from './widgets/LatestPostsWidget';
import RotatingClubsWidget from './widgets/RotatingClubsWidget';
import FooterPolicyWidget from './widgets/FooterPolicyWidget';

export default function SidebarRight() {
  return (
    <div className="space-y-4 py-2">
      <BriefProfileWidget />
      <LatestPostsWidget />
      <RotatingClubsWidget />
      <FooterPolicyWidget />
    </div>
  );
}