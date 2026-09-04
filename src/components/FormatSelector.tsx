import { useState } from 'react';
import { Video, Music, Settings2, Check, Sparkles, Sliders, HardDrive, FileAudio, FileVideo, Scissors } from 'lucide-react';
import { VideoMetadata, VideoFormatOption, AudioFormatOption } from '../types';

interface FormatSelectorProps {
  metadata: VideoMetadata;
  selectedType: 'video' | 'audio';
  onSelectType: (type: 'video' | 'audio') => void;
  selectedVideoFormat: VideoFormatOption;
  onSelectVideoFormat: (fmt: VideoFormatOption) => void;
  selectedAudioFormat: AudioFormatOption;
  onSelectAudioFormat: (fmt: AudioFormatOption) => void;
  customFilename: string;
  onChangeCustomFilename: (name: string) => void;
  trimStart: string;
  onChangeTrimStart: (time: string) => void;
  trimEnd: string;
  onChangeTrimEnd: (time: string) => void;
  enableTrim: boolean;
  onToggleTrim: (enable: boolean) => void;
}

export function FormatSelector({
  metadata,
  selectedType,
  onSelectType,
  selectedVideoFormat,
  onSelectVideoFormat,
  selectedAudioFormat,
  onSelectAudioFormat,
  customFilename,
  onChangeCustomFilename,
  trimStart,
  onChangeTrimStart,
  trimEnd,
  onChangeTrimEnd,
  enableTrim,
  onToggleTrim
}: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'custom'>('video');

  const handleTabSwitch = (tab: 'video' | 'audio' | 'custom') => {
    setActiveTab(tab);
    if (tab === 'video' || tab === 'audio') {
      onSelectType(tab);
    }
  };

  return (
    <div id="format-selector-container" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Select Quality & Format</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose your preferred resolution or audio bitrate before saving locally</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
          <button
            id="tab-video-btn"
            onClick={() => handleTabSwitch('video')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === 'video' && activeTab !== 'custom'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video (MP4)</span>
          </button>

          <button
            id="tab-audio-btn"
            onClick={() => handleTabSwitch('audio')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === 'audio' && activeTab !== 'custom'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio / Voice (MP3)</span>
          </button>

          <button
            id="tab-options-btn"
            onClick={() => handleTabSwitch('custom')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'custom'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Options</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Video Resolutions Grid */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Available Video Resolutions:</span>
            <span>MP4 & WebM Containers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {metadata.videoFormats.map((fmt, idx) => {
              const isSelected = selectedType === 'video' && selectedVideoFormat.resolution === fmt.resolution && selectedVideoFormat.container === fmt.container;
              const is4k = fmt.resolution.includes('2160p');
              const is1080p = fmt.resolution.includes('1080p');

              return (
                <button
                  key={idx}
                  id={`video-format-card-${idx}`}
                  onClick={() => {
                    onSelectType('video');
                    onSelectVideoFormat(fmt);
                  }}
                  className={`relative p-4 rounded-2xl text-left border transition flex flex-col justify-between gap-3.5 ${
                    isSelected
                      ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-slate-900">{fmt.resolution}</span>
                        {is4k && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            4K UHD
                          </span>
                        )}
                        {is1080p && !fmt.resolution.includes('WebM') && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
                            Best
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{fmt.qualityLabel}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className="uppercase text-slate-700 font-semibold">{fmt.container} • {fmt.fps} FPS</span>
                    <span className="text-slate-900 font-bold">~{fmt.approxSizeMb} MB</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Audio Formats & Bitrates */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Available Audio Bitrates & Formats:</span>
            <span>Directly extracted for speech, podcasts & music</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {metadata.audioFormats.map((fmt, idx) => {
              const isSelected = selectedType === 'audio' && selectedAudioFormat.label === fmt.label;
              const is320 = fmt.bitrate.includes('320');
              const isLossless = fmt.qualityBadge === 'Lossless';

              return (
                <button
                  key={idx}
                  id={`audio-format-card-${idx}`}
                  onClick={() => {
                    onSelectType('audio');
                    onSelectAudioFormat(fmt);
                  }}
                  className={`relative p-4 rounded-2xl text-left border transition flex flex-col justify-between gap-3.5 ${
                    isSelected
                      ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-slate-900 uppercase">{fmt.format}</span>
                        <span className="text-[11px] font-mono text-slate-600 font-bold">{fmt.bitrate}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{fmt.label}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-sans font-bold ${
                      isLossless
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : is320
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {fmt.qualityBadge}
                    </span>
                    <span className="text-slate-900 font-bold">~{fmt.approxSizeMb} MB</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Options (Custom Filename & Video Trimming) */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Custom File Name (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-filename-input"
                type="text"
                value={customFilename}
                onChange={(e) => onChangeCustomFilename(e.target.value)}
                placeholder={metadata.title}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => onChangeCustomFilename(metadata.title)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-xs text-slate-700 font-semibold border border-slate-300 shadow-2xs"
              >
                Reset
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Output will be saved as: <span className="text-slate-900 font-mono font-bold">{customFilename || metadata.title}.{selectedType === 'video' ? selectedVideoFormat.container : selectedAudioFormat.format}</span>
            </p>
          </div>

          {/* Video Clip Trimming Selector */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800">Time Range Selector (Trim Clip)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="toggle-trim-checkbox"
                  type="checkbox"
                  checked={enableTrim}
                  onChange={(e) => onToggleTrim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            {enableTrim && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Time (MM:SS)</label>
                  <input
                    id="trim-start-input"
                    type="text"
                    value={trimStart}
                    onChange={(e) => onChangeTrimStart(e.target.value)}
                    placeholder="00:00"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Time (MM:SS)</label>
                  <input
                    id="trim-end-input"
                    type="text"
                    value={trimEnd}
                    onChange={(e) => onChangeTrimEnd(e.target.value)}
                    placeholder={metadata.formattedDuration}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
