import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, Heart, Laugh, LoaderCircle, RefreshCw, Share2, Sparkles, WandSparkles } from 'lucide-react';

type Joke = { category: string; type: 'single' | 'twopart'; joke?: string; setup?: string; delivery?: string; id: number };
const categories = ['Any', 'Programming', 'Misc', 'Pun', 'Spooky', 'Christmas'];
const categoryNames: Record<string, string> = { Any: 'Surprise me', Programming: 'Programming', Misc: 'A little bit of everything', Pun: 'Puns', Spooky: 'Spooky', Christmas: 'Christmas' };
const API = 'https://v2.jokeapi.dev/joke';

export default function App() {
  const [category, setCategory] = useState('Any');
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<Joke[]>(() => {
    try { return JSON.parse(localStorage.getItem('one-more-joke-favorites') ?? '[]'); } catch { return []; }
  });
  const [copied, setCopied] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const requestId = useRef(0);

  useEffect(() => { localStorage.setItem('one-more-joke-favorites', JSON.stringify(favorites)); }, [favorites]);

  const getJoke = useCallback(async (selectedCategory = category) => {
    const id = ++requestId.current;
    setLoading(true); setError(''); setShowFavorites(false);
    try {
      const response = await fetch(`${API}/${encodeURIComponent(selectedCategory)}?safe-mode`);
      if (!response.ok) throw new Error('The joke service is taking a breather. Try again in a moment.');
      const data = await response.json();
      if (data.error) throw new Error(data.message || 'Could not find a joke right now.');
      if (id !== requestId.current) return;
      setJoke({ category: data.category, type: data.type, joke: data.joke, setup: data.setup, delivery: data.delivery, id: data.id });
    } catch (reason) {
      if (id === requestId.current) setError(reason instanceof Error ? reason.message : 'Something went wrong. Please check your connection and retry.');
    } finally { if (id === requestId.current) setLoading(false); }
  }, [category]);

  useEffect(() => { void getJoke('Any'); }, []); // Initial surprise; category changes are applied on the button click.

  const text = joke ? (joke.type === 'single' ? joke.joke ?? '' : `${joke.setup ?? ''}\n\n${joke.delivery ?? ''}`) : '';
  const isFavorite = joke ? favorites.some((item) => item.id === joke.id) : false;
  const toggleFavorite = () => {
    if (!joke) return;
    setFavorites((items) => isFavorite ? items.filter((item) => item.id !== joke.id) : [joke, ...items]);
  };
  const copyJoke = async (value = text) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copy your joke:', value); }
  };
  const shareJoke = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'A joke for you', text }); return; } catch { /* Sharing dismissed. */ }
    }
    await copyJoke();
  };

  return <div className="app-shell">
    <div className="grain" aria-hidden="true" />
    <header className="topbar"><a className="brand" href="#home" aria-label="One More Joke home"><span className="brand-mark"><Laugh size={19} /></span><span>one more<span className="brand-accent"> joke</span><small>YOUR DAILY DOSE OF HA-HA</small></span></a><div className="top-right"><span className="api-status"><i /> LIVE JOKE FEED</span><a className="api-link" href="https://jokeapi.dev/" target="_blank" rel="noreferrer">Powered by JokeAPI <ExternalLink size={12}/></a></div></header>
    <main id="home" className="main-content">
      <section className="intro"><div className="eyebrow"><Sparkles size={14} /> A LITTLE JOY, ON DEMAND</div><h1>Need a laugh?<br/><span>We got you.</span></h1><p>Fresh jokes, fetched just for you. Pick a vibe or leave it to fate.</p></section>
      <section className="generator" aria-label="Random joke generator">
        <div className="generator-top"><div><span className="section-label">PICK YOUR FLAVOR</span><div className="category-select-wrap"><WandSparkles size={16}/><select aria-label="Joke category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{categoryNames[item]}</option>)}</select><ChevronDown size={15}/></div></div><div className="card-count"><span className="pulse-dot"/> NO. <b>{joke ? joke.id.toString().padStart(4, '0') : '----'}</b></div></div>
        <div className={`joke-display ${loading ? 'is-loading' : ''}`} aria-live="polite" aria-busy={loading}>
          {loading ? <div className="loading-state"><span className="loader-icon"><LoaderCircle size={31}/></span><b>Finding your next laugh...</b><small>Good things take a second.</small></div> : error ? <div className="error-state"><span>🤔</span><b>Well, this is awkward.</b><p>{error}</p><button className="text-button" onClick={() => void getJoke()}>Try again <RefreshCw size={14}/></button></div> : joke ? <div key={joke.id} className="joke-content"><div className="joke-category"><span>✦</span> {joke.category} <span className="category-tag">{joke.type === 'twopart' ? 'KNOCK KNOCK' : 'ONE-LINER'}</span></div>{joke.type === 'twopart' ? <><p className="joke-setup">{joke.setup}</p><p className="joke-delivery">{joke.delivery}</p></> : <p className="joke-single">{joke.joke}</p>}<div className="laugh-mark">HA <span>HA</span></div></div> : null}
        </div>
        <div className="card-bottom"><span><span className="safe-icon">✓</span> Safe mode is on</span><div className="joke-actions"><button className={`round-action ${isFavorite ? 'favorited' : ''}`} aria-label={isFavorite ? 'Remove from saved jokes' : 'Save joke'} title={isFavorite ? 'Saved' : 'Save joke'} onClick={toggleFavorite} disabled={!joke || loading}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'}/></button><button className="round-action" aria-label="Copy joke" title="Copy joke" onClick={() => void copyJoke()} disabled={!joke || loading}>{copied ? <Check size={17}/> : <Copy size={16}/>}</button><button className="round-action" aria-label="Share joke" title="Share joke" onClick={() => void shareJoke()} disabled={!joke || loading}><Share2 size={16}/></button></div></div>
        <button className="new-joke-button" onClick={() => void getJoke()} disabled={loading}><span>{loading ? 'Finding a joke...' : 'Get another joke'}</span>{loading ? <LoaderCircle className="spin" size={18}/> : <RefreshCw size={17}/>}</button>
      </section>
      <button className="saved-toggle" onClick={() => setShowFavorites(!showFavorites)} aria-expanded={showFavorites}><Heart size={15} fill={favorites.length ? 'currentColor' : 'none'}/> {showFavorites ? 'Hide saved jokes' : 'Your saved jokes'} <span>{favorites.length}</span><ChevronDown className={showFavorites ? 'chevron-up' : ''} size={15}/></button>
      {showFavorites && <section className="favorites-list" aria-label="Saved jokes">{favorites.length ? favorites.map((item) => <article className="favorite-item" key={item.id}><span className="favorite-category">{item.category}</span><p>{item.type === 'single' ? item.joke : `${item.setup} — ${item.delivery}`}</p><div><button onClick={() => void copyJoke(item.type === 'single' ? item.joke ?? '' : `${item.setup}\n\n${item.delivery}`)}><Copy size={13}/> Copy</button><button onClick={() => setFavorites((items) => items.filter((saved) => saved.id !== item.id))}><Heart size={13} fill="currentColor"/> Remove</button></div></article>) : <p className="empty-favorites">Nothing saved just yet. Tap the heart on a joke to keep it.</p>}</section>}
      <div className="bottom-note"><span>✳</span> HUMOR IS THE SHORTEST DISTANCE BETWEEN TWO PEOPLE. <span>✳</span></div>
    </main>
    <footer><span>MADE FOR THE MOMENTS YOU NEED A SMILE.</span><span>Jokes provided by <a href="https://jokeapi.dev/" target="_blank" rel="noreferrer">JokeAPI</a></span></footer>
  </div>;
}
