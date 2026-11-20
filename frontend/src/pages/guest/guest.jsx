import { KeeperSearch } from '../../components/KeeperSearch';
import '../../components/marketplace.css';

const USEFUL_LINKS = [
  { link: 'https://www.petmd.com/', title: 'PetMD', text: 'Visit PetMD' },
  { link: 'http://katoikidio.gr/', title: 'Katoikidio.gr', text: 'Visit Katoikidio.gr' },
  { link: 'https://eshopkatoikidio.gr/', title: 'Eshop Katoikidio', text: 'Visit Eshop Katoikidio' },
];

export const Guest = () => {
  return (
    <div className="dashboard">
      <header className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">Find a keeper</h1>
          <span className="cardMeta">Trusted pet keepers near you</span>
        </div>
      </header>
      <KeeperSearch />
      <section className="panel">
        <h2 className="panelTitle">Useful links</h2>
        <div className="cardGrid">
          {USEFUL_LINKS.map((l) => (
            <a className="card linkCard" key={l.link} href={l.link} target="_blank" rel="noopener noreferrer">
              <span className="cardTitle">{l.title}</span>
              <span className="cardMeta">{l.text} ↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
