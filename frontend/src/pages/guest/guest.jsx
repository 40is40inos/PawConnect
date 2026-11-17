import { useNavigate } from 'react-router-dom';
import { KeeperSearch } from '../../components/KeeperSearch';
import '../../components/marketplace.css';

const USEFUL_LINKS = [
  { link: 'https://www.petmd.com/', title: 'PetMD', text: 'Visit PetMD' },
  { link: 'http://katoikidio.gr/', title: 'Katoikidio.gr', text: 'Visit Katoikidio.gr' },
  { link: 'https://eshopkatoikidio.gr/', title: 'Eshop Katoikidio', text: 'Visit Eshop Katoikidio' },
];

export const Guest = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">PawConnect</h1>
          <span className="cardMeta">Trusted pet keepers near you</span>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Log in
          </button>
          <button className="btn" onClick={() => navigate('/register')}>
            Sign up
          </button>
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
