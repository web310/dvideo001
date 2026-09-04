import { useState } from 'react';
import { Sparkles, Zap, Shield, Tv, Headphones, HelpCircle, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    question: 'How do I download the genuine full video file (e.g. 191.3MB) with full audio and voice?',
    answer: 'Use the "1-Click Direct Download" option in the Download Panel. This immediately connects to high-speed gateways (SSYouTube, Cobalt, Y2Mate) that serve the complete original 1080p, 720p, or 4K MP4 file with the original soundtrack and voice track at full file size, without requiring any software installation.'
  },
  {
    question: 'Can the web browser play the video and record it into a downloadable file?',
    answer: 'Yes! Select the "Web Play & Live Record" tab. The app plays the YouTube video in high definition while capturing the tab video and audio stream using the browser’s native Screen & Audio Capture API. When prompted by your browser, choose "This Tab" and ensure "Share tab audio" is checked so the real voice and sound are recorded. You can watch the live VU volume meter and file size counter as it records, then click "Finish & Save" to save the full recording.'
  },
  {
    question: 'What resolutions and formats are supported?',
    answer: 'CanaanTech supports video resolutions from 360p up to 4K Ultra HD (2160p, 1440p, 1080p, 720p, 480p) in MP4 and WebM formats, as well as audio extraction in MP3 (up to 320kbps), M4A / AAC, WAV lossless PCM, FLAC, and OPUS.'
  },
  {
    question: 'Where are the downloaded files saved on my device?',
    answer: 'All downloaded videos and audio files are saved directly to your device default Downloads folder (or whichever location your browser is configured to store downloaded files).'
  },
  {
    question: 'Can I download YouTube Shorts and YouTube Music?',
    answer: 'Yes! CanaanTech fully supports regular YouTube videos, YouTube Shorts, YouTube Music tracks, and shortened youtu.be links.'
  }
];

export function FeaturesFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div id="features-and-faq-container" className="space-y-8 pt-2">
      
      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3.5">
            <Tv className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Up to 4K Ultra HD</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Select 2160p 4K, 1080p Full HD, or 720p with crystal clear 60 FPS playback.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3.5">
            <Headphones className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">320kbps MP3 Audio</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Extract high-fidelity audio tracks in MP3, M4A, WAV, or FLAC formats for offline listening.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3.5">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Fast & Local Saving</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Direct file delivery without watermarks, registration, or software installation.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3.5">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">All Links & Shorts</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Paste any YouTube URL, Shorts clip, or Music link to convert instantly.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl bg-slate-50/70 overflow-hidden transition"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-900 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
