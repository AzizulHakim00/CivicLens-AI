"use client";

import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  CloudRain,
  Eye,
  Film,
  MapPin,
  Pause,
  Play,
  Radio,
  Recycle,
  ScanLine,
  Sparkles,
  TrafficCone,
  Video,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const mediaStories = [
  { id: "CL-3018", type: "Pothole", area: "Dhanmondi", location: "Mirpur Road · Science Lab", severity: "Critical", confidence: 97, reports: 7, age: "4 min", image: "/media/pothole-scene.svg", source: "Dashcam 07", team: "Road Alpha" },
  { id: "CL-3017", type: "Waterlogging", area: "Karwan Bazar", location: "Kazi Nazrul Islam Avenue", severity: "High", confidence: 94, reports: 5, age: "11 min", image: "/media/waterlogging-scene.svg", source: "CCTV 12", team: "Drainage 2" },
  { id: "CL-3016", type: "Plastic waste", area: "Banani", location: "Road 27 · Banani", severity: "Medium", confidence: 91, reports: 3, age: "18 min", image: "/media/waste-scene.svg", source: "Citizen", team: "Clean City 4" },
  { id: "CL-3015", type: "Open manhole", area: "Mohammadpur", location: "Satmasjid Road", severity: "Critical", confidence: 96, reports: 6, age: "24 min", image: "/media/manhole-scene.svg", source: "Citizen", team: "Rapid Works" },
  { id: "CL-3014", type: "Broken road", area: "Badda", location: "Badda Link Road", severity: "High", confidence: 92, reports: 4, age: "31 min", image: "/media/broken-road-scene.svg", source: "Drone 03", team: "Road Beta" },
  { id: "CL-3013", type: "Damaged streetlight", area: "Khilkhet", location: "Airport Road · Nikunja", severity: "Medium", confidence: 90, reports: 2, age: "46 min", image: "/media/streetlight-scene.svg", source: "CCTV 19", team: "Electrical 1" },
  { id: "CL-3012", type: "Traffic obstruction", area: "Farmgate", location: "Indira Road crossing", severity: "High", confidence: 93, reports: 8, age: "52 min", image: "/media/broken-road-scene.svg", source: "CCTV 08", team: "Traffic North" },
  { id: "CL-3011", type: "Illegal dumping", area: "Gabtoli", location: "Beribadh Road", severity: "High", confidence: 95, reports: 9, age: "1 hr", image: "/media/waste-scene.svg", source: "Drone 05", team: "Clean City 2" },
  { id: "CL-3010", type: "Pothole", area: "Gulshan", location: "Gulshan Avenue 2", severity: "Low", confidence: 88, reports: 2, age: "1 hr", image: "/media/pothole-scene.svg", source: "Dashcam 14", team: "Road Gamma" },
  { id: "CL-3009", type: "Waterlogging", area: "Motijheel", location: "Shapla Chattar link", severity: "Medium", confidence: 89, reports: 4, age: "2 hr", image: "/media/waterlogging-scene.svg", source: "Citizen", team: "Drainage 5" },
  { id: "CL-3008", type: "Open manhole", area: "Old Dhaka", location: "Nazimuddin Road", severity: "High", confidence: 94, reports: 5, age: "2 hr", image: "/media/manhole-scene.svg", source: "CCTV 22", team: "Rapid Works" },
  { id: "CL-3007", type: "Broken road", area: "Uttara", location: "Sector 10 road 12", severity: "Medium", confidence: 90, reports: 3, age: "3 hr", image: "/media/broken-road-scene.svg", source: "Drone 02", team: "Road Delta" },
  { id: "CL-3006", type: "Plastic waste", area: "Jatrabari", location: "Mayor Hanif flyover entry", severity: "Medium", confidence: 92, reports: 6, age: "3 hr", image: "/media/waste-scene.svg", source: "Citizen", team: "Clean City 8" },
  { id: "CL-3005", type: "Damaged streetlight", area: "Tejgaon", location: "Industrial Area road 4", severity: "High", confidence: 91, reports: 3, age: "4 hr", image: "/media/streetlight-scene.svg", source: "CCTV 17", team: "Electrical 3" },
  { id: "CL-3004", type: "Traffic obstruction", area: "Mohakhali", location: "Bus terminal approach", severity: "High", confidence: 96, reports: 11, age: "4 hr", image: "/media/broken-road-scene.svg", source: "CCTV 03", team: "Traffic Central" },
  { id: "CL-3003", type: "Illegal dumping", area: "Rampura", location: "Banasree canal road", severity: "Medium", confidence: 89, reports: 4, age: "5 hr", image: "/media/waste-scene.svg", source: "Drone 08", team: "Clean City 6" },
  { id: "CL-3002", type: "Pothole", area: "Shahbag", location: "Kazi Nazrul Avenue south", severity: "High", confidence: 95, reports: 6, age: "5 hr", image: "/media/pothole-scene.svg", source: "Dashcam 09", team: "Road Alpha" },
  { id: "CL-3001", type: "Waterlogging", area: "Malibagh", location: "Railgate crossing", severity: "Critical", confidence: 97, reports: 10, age: "6 hr", image: "/media/waterlogging-scene.svg", source: "CCTV 25", team: "Drainage Rapid" },
] as const;

const zones = [
  { name: "Central", cameras: 46, signals: 128, resolved: 84, health: 98 },
  { name: "North", cameras: 38, signals: 96, resolved: 71, health: 94 },
  { name: "South", cameras: 33, signals: 82, resolved: 63, health: 91 },
  { name: "West", cameras: 29, signals: 74, resolved: 58, health: 89 },
];

function HazardGlyph({ type }: { type: string }) {
  if (type === "Pothole") return <CircleDot size={16} />;
  if (type === "Waterlogging") return <Waves size={16} />;
  if (type === "Plastic waste" || type === "Illegal dumping") return <Recycle size={16} />;
  if (type === "Traffic obstruction") return <TrafficCone size={16} />;
  if (type === "Damaged streetlight") return <Zap size={16} />;
  return <AlertTriangle size={16} />;
}

export default function CityMediaExperience() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filters = ["All", "Critical", "High", "Waterlogging", "Pothole", "Waste"];
  const filtered = useMemo(() => {
    if (filter === "All") return mediaStories;
    if (filter === "Waste") return mediaStories.filter((story) => story.type === "Plastic waste" || story.type === "Illegal dumping");
    if (filter === "Pothole" || filter === "Waterlogging") return mediaStories.filter((story) => story.type === filter);
    return mediaStories.filter((story) => story.severity === filter);
  }, [filter]);

  const selected = filtered[selectedIndex % filtered.length] ?? mediaStories[0];

  const toggleVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play().catch(() => undefined);
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const moveStory = (direction: number) => {
    setSelectedIndex((current) => (current + direction + filtered.length) % filtered.length);
  };

  return (
    <>
      <button className="media-launcher" type="button" onClick={() => setOpen(true)}>
        <span><Film size={18} /></span>
        <div><strong>City media hub</strong><small>18 incidents · live video</small></div>
        <Sparkles size={15} />
      </button>

      {open && (
        <div className="media-shell" role="dialog" aria-modal="true" aria-label="CivicLens city media intelligence">
          <div className="media-topbar">
            <div>
              <span className="media-brand"><Video size={18} /></span>
              <div><strong>City media intelligence</strong><small>Demo city dataset · synthetic incident illustrations + licensed stock traffic footage</small></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close city media hub"><X size={19} /></button>
          </div>

          <main className="media-content">
            <section className="media-hero-grid">
              <article className="media-video-card">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/media/pothole-scene.svg"
                  preload="metadata"
                >
                  <source src="https://www.pexels.com/download/video/13275193/" type="video/mp4" />
                </video>
                <div className="media-video-shade" />
                <div className="media-video-scan" />
                <div className="media-video-head">
                  <span><Radio size={13} /> LIVE ROAD FEED</span>
                  <strong>CAM-DHK-07</strong>
                </div>
                <div className="media-detection-box box-one"><span>Vehicle 98%</span></div>
                <div className="media-detection-box box-two"><span>Road risk 94%</span></div>
                <div className="media-video-copy">
                  <p><ScanLine size={15} /> Edge inference stream</p>
                  <h2>Dhaka mobility pulse</h2>
                  <span>AI overlays are simulated for the CivicLens product demo.</span>
                </div>
                <button className="media-play" type="button" onClick={() => void toggleVideo()}>
                  {playing ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <a className="media-credit" href="https://www.pexels.com/video/traffic-on-street-13275193/" target="_blank" rel="noreferrer">Traffic footage: Pew Nguyen / Pexels</a>
              </article>

              <aside className="media-live-stack">
                <div className="media-live-title"><span><Activity size={15} /> Live network</span><b>146 cameras online</b></div>
                {[mediaStories[1], mediaStories[3], mediaStories[5]].map((story, index) => (
                  <button key={story.id} type="button" onClick={() => { setFilter("All"); setSelectedIndex(mediaStories.indexOf(story)); }}>
                    <Image src={story.image} alt={`${story.type} demo incident`} width={190} height={110} />
                    <span className="media-camera-live"><i /> CAM {12 + index * 5}</span>
                    <div><strong>{story.type}</strong><small>{story.area} · {story.confidence}%</small></div>
                  </button>
                ))}
              </aside>
            </section>

            <section className="media-kpis">
              <article><span><Camera size={18} /></span><div><small>Active cameras</small><strong>146 / 158</strong><p>92.4% network coverage</p></div></article>
              <article><span><Eye size={18} /></span><div><small>Frames today</small><strong>284,610</strong><p>11.8 frames processed/sec</p></div></article>
              <article><span><AlertTriangle size={18} /></span><div><small>Demo incidents</small><strong>18</strong><p>6 high-priority signals</p></div></article>
              <article><span><CheckCircle2 size={18} /></span><div><small>Field completion</small><strong>76%</strong><p>328 resolved this month</p></div></article>
            </section>

            <section className="media-story-section">
              <div className="media-section-head">
                <div><p><Sparkles size={14} /> EVIDENCE STORYBOARD</p><h2>Hazard image intelligence</h2><span>Explore richer demo incidents across Dhaka zones.</span></div>
                <div className="media-filter-row">
                  {filters.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => { setFilter(item); setSelectedIndex(0); }}>{item}</button>)}
                </div>
              </div>

              <div className="media-story-grid">
                <article className="media-featured-story">
                  <Image src={selected.image} alt={`${selected.type} detection illustration`} width={960} height={600} priority />
                  <div className="media-story-gradient" />
                  <div className="media-story-nav">
                    <button type="button" onClick={() => moveStory(-1)} aria-label="Previous incident"><ChevronLeft size={18} /></button>
                    <span>{(selectedIndex % filtered.length) + 1} / {filtered.length}</span>
                    <button type="button" onClick={() => moveStory(1)} aria-label="Next incident"><ChevronRight size={18} /></button>
                  </div>
                  <div className="media-story-detail">
                    <span className={`media-severity media-${selected.severity.toLowerCase()}`}>{selected.severity}</span>
                    <p>{selected.id} · {selected.source}</p>
                    <h3>{selected.type}</h3>
                    <span><MapPin size={13} /> {selected.location}</span>
                    <div><b>{selected.confidence}% confidence</b><b>{selected.reports} nearby reports</b><b>{selected.team}</b></div>
                  </div>
                </article>

                <div className="media-gallery">
                  {filtered.slice(0, 8).map((story, index) => (
                    <button className={selected.id === story.id ? "active" : ""} key={story.id} type="button" onClick={() => setSelectedIndex(index)}>
                      <Image src={story.image} alt={`${story.type} incident thumbnail`} width={330} height={200} />
                      <div><span><HazardGlyph type={story.type} /></span><p><strong>{story.type}</strong><small>{story.area} · {story.age}</small></p><b>{story.confidence}%</b></div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="media-lower-grid">
              <article className="media-zone-panel">
                <div className="media-panel-head"><div><h3>Zone operations</h3><p>Camera, signal and resolution activity</p></div><CloudRain size={18} /></div>
                {zones.map((zone) => (
                  <div className="media-zone-row" key={zone.name}>
                    <span>{zone.name}</span><div><i style={{ width: `${zone.health}%` }} /></div><b>{zone.health}%</b><small>{zone.cameras} cams</small><small>{zone.signals} signals</small><small>{zone.resolved} resolved</small>
                  </div>
                ))}
              </article>

              <article className="media-timeline-panel">
                <div className="media-panel-head"><div><h3>Live incident timeline</h3><p>Latest demo events from the city network</p></div><Clock3 size={18} /></div>
                {mediaStories.slice(0, 6).map((story, index) => (
                  <div className="media-timeline-row" key={story.id}>
                    <span className={`media-timeline-dot media-${story.severity.toLowerCase()}`} />
                    <div><strong>{story.type} detected</strong><small>{story.location}</small></div>
                    <b>{index * 7 + 2}m</b>
                  </div>
                ))}
              </article>
            </section>
          </main>
        </div>
      )}
    </>
  );
}
