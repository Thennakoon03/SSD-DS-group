import LandingNav      from '../../Componets/SharedComponents/LandingNav';
import Hero            from '../../Componets/SharedComponents/Hero';
import DashboardPreview from '../../Componets/SharedComponents/DashboardPreview';
import Features        from '../../Componets/SharedComponents/Features';
import HowItWorks      from '../../Componets/SharedComponents/HowItWorks';
import Portals         from '../../Componets/SharedComponents/Portals';
import Stats           from '../../Componets/SharedComponents/Stats';
import About           from '../../Componets/SharedComponents/About';
import LandingFooter   from '../../Componets/SharedComponents/LandingFooter';

const Landing = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    <LandingNav />
    <Hero />
    <DashboardPreview />
    <Features />
    <HowItWorks />
    <Portals />
    <Stats />
    <About />
    <LandingFooter />
  </div>
);

export default Landing;
