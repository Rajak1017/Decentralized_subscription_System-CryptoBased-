import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';
import { paymentService } from '../services/paymentService';

export default function Watch() {
  const { planId } = useParams();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<{ id: string; title: string; channel: string; thumb: string } | null>(null);
  const [results, setResults] = useState<Array<{ id: string; title: string; channel: string; thumb: string }>>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);

  // Fallback demo catalog (public trailers/CC content)
  const fallbackCatalog = useMemo(() => ([
    { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny (Trailer)', channel: 'Blender Foundation', thumb: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/mqdefault.jpg' },
    { id: 'eRsGyueVLvQ', title: 'Sintel (Trailer)', channel: 'Blender Foundation', thumb: 'https://i.ytimg.com/vi/eRsGyueVLvQ/mqdefault.jpg' },
    { id: 'R6MlUcmOul8', title: 'Tears of Steel (Trailer)', channel: 'Blender Foundation', thumb: 'https://i.ytimg.com/vi/R6MlUcmOul8/mqdefault.jpg' },
    { id: 'bMknfKXIFA8', title: 'React JS – Full Course for Beginners', channel: 'freeCodeCamp.org', thumb: 'https://i.ytimg.com/vi/bMknfKXIFA8/mqdefault.jpg' },
    { id: 'wXMl1N3N7ZQ', title: 'Ethereum Explained', channel: 'Simply Explained', thumb: 'https://i.ytimg.com/vi/wXMl1N3N7ZQ/mqdefault.jpg' },
  ]), []);

  const setResultsFromFallback = (q: string) => {
    const t = q.trim().toLowerCase();
    let list = t
      ? fallbackCatalog.filter(v => v.title.toLowerCase().includes(t) || v.channel.toLowerCase().includes(t))
      : fallbackCatalog;
    // If no fallback videos match the query, show the full demo catalog
    if (!list.length) {
      list = fallbackCatalog;
    }
    setResults(list);
    if (list.length) setSelected(list[0]);
    // Debug video titles for fallback
    try {
      console.groupCollapsed('[YT] fallback results');
      console.log('query:', q);
      console.log('count:', list.length);
      console.table(list.map(v => ({ id: v.id, title: v.title, channel: v.channel })));
      console.groupEnd();
    } catch {}
  };

  // Fetch from YouTube Data API v3
  const fetchYouTube = async (q: string, pageToken?: string, append: boolean = false) => {
    if (isLoading) {
      console.log('[YT] Skipping fetch, already loading');
      return;
    }
    setIsLoading(true);
    // Use backend proxy to avoid exposing keys and to fix env issues
    const maxResults = 20; // 4x5 grid initially
    const baseUrl = `/api/youtube/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(q)}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const url = baseUrl;
    console.groupCollapsed('[YT] fetch');
    console.log('query:', q);
    console.log('pageToken:', pageToken);
    console.log('append:', append);
    console.log('url:', url);
    let resp: Response;
    let json: any = {};
    try {
      resp = await fetch(url, { method: 'GET', mode: 'cors' });
      json = await resp.json().catch(() => ({}));
    } catch (networkErr) {
      console.error('[YT] network error:', networkErr);
      setMessage('Network error contacting YouTube. Check your connection and API key restrictions.');
      setIsLoading(false);
      return;
    }
    console.log('status:', resp.status, resp.statusText);
    if (!resp.ok) console.log('error payload:', json);
    if (!resp.ok) {
      const errMsg = json?.error?.message || `Failed to load videos (HTTP ${resp.status}). Showing example videos.`;
      setMessage(errMsg);
      if (!append) setResultsFromFallback(q);
      setNextPageToken(null);
      console.groupEnd();
      setIsLoading(false);
      return;
    }
    const mapped = (json.items || []).map((it: any) => ({
      id: it.id.videoId,
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || '',
    }));
    // If YouTube returns no items, fall back to the demo catalog
    if (!mapped.length && !append) {
      setMessage('No results from YouTube. Showing example videos.');
      setResultsFromFallback(q);
      setNextPageToken(null);
      console.groupEnd();
      setIsLoading(false);
      return;
    }
    setResults(prev => (append ? [...prev, ...mapped] : mapped));
    setNextPageToken(json.nextPageToken || null);
    if (mapped.length) setSelected(mapped[0]);
    console.log('items:', mapped.length);
    console.log('nextPageToken:', json.nextPageToken || null);
    console.table(mapped.map(v => ({ id: v.id, title: v.title, channel: v.channel })));
    console.groupEnd();
    setIsLoading(false);
  };

  // Log any time results change (useful if rendering issues hide console above)
  useEffect(() => {
    if (!results) return;
    try {
      console.groupCollapsed('[YT] render list');
      console.log('rendering videos:', results.length);
      console.table(results.map(v => ({ id: v.id, title: v.title, channel: v.channel })));
      console.groupEnd();
    } catch {}
  }, [results]);

  useEffect(() => {
    console.log('[Watch] mounted with planId:', planId);
    (async () => {
      try {
        if (!planId) {
          setIsAllowed(false);
          setMessage('Invalid plan ID.');
          return;
        }
        // Verify subscription on-chain
        const status = await paymentService.getSubscriptionStatus(String(planId));
        const now = Math.floor(Date.now() / 1000);
        const active = !!status.isActive && Number(status.expiry || 0) > now;
        setIsAllowed(active);
        console.log('[Watch] subscription status:', status, 'computedActive:', active);
        if (!active) {
          setMessage('Your subscription is not active.');
        } else {
          setMessage('');
        }
      } catch (e: any) {
        setIsAllowed(false);
        const msg = String(e?.message || 'Failed to verify subscription');
        setMessage(msg);
        console.error('[Watch] verify error:', e);
      }
    })();
  }, [planId]);

  // Only fetch when access is allowed
  useEffect(() => {
    if (!isAllowed) return;
    console.log('[Watch] initial fetch trigger');
    fetchYouTube('blockchain tutorial');
  }, [isAllowed]);

  // Debounced search (only when subscribed)
  useEffect(() => {
    if (!isAllowed) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const q = query.trim();
      fetchYouTube(q || 'blockchain tutorial');
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, isAllowed]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Exclusive Videos</h1>
        {isAllowed === false && (
          <Card className="card-gradient p-3 mb-4">
            <div className="text-sm text-muted-foreground">
              {message || 'Access restricted. You can browse results, but playback requires an active subscription.'}
            </div>
          </Card>
        )}

        {/* Info banner for API/network messages */}
        {message && isAllowed !== false && (
          <Card className="card-gradient p-3 mb-4">
            <div className="text-sm text-muted-foreground">{message}</div>
          </Card>
        )}

        {/* Search bar (only when allowed) */}
        {isAllowed && (
        <form
          className="mb-6 max-w-3xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            setResults([]);
            setNextPageToken(null);
            fetchYouTube(query || 'trending');
          }}
        >
          <div className="flex gap-2 items-center justify-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                placeholder="Search videos (e.g., punjabi songs, cartoons)"
              />
            </div>
            <Button type="submit" className="btn-gradient">Search</Button>
          </div>
        </form>
        )}

        {/* Player (only when allowed) */}
        {isAllowed && selected && (
          <Card className="card-gradient p-4 mb-8">
            <div className="text-lg font-semibold mb-2">{selected.title}</div>
            <div className="aspect-video w-full rounded overflow-hidden">
              <iframe
                key={selected.id}
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${selected.id}`}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                loading="lazy"
                tabIndex={-1}
                allowFullScreen
              />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{selected.channel}</div>
          </Card>
        )}

        {/* Results grid (only when allowed) */}
        {isAllowed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((v) => (
              <Card key={v.id} className="card-gradient p-3 hover:shadow-glow transition cursor-pointer" onClick={() => setSelected(v)}>
                <div className="aspect-video bg-muted/20 rounded mb-3 overflow-hidden">
                  {v.thumb ? (
                    <img src={v.thumb} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="font-medium leading-tight line-clamp-2">{v.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{v.channel}</div>
              </Card>
            ))}
          </div>
        )}

        {isAllowed && nextPageToken && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="px-6"
              onClick={() => fetchYouTube(query || 'trending', nextPageToken, true)}
            >
              See More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
