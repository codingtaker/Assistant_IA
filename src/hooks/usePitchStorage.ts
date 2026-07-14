
import { useState, useEffect } from 'react';
import { GeneratedPitch, ProjectData } from '@/pages/Index';

export interface SavedPitch {
  id: string;
  name: string;
  projectData: ProjectData;
  pitch: GeneratedPitch;
  template: string;
  createdAt: string;
  updatedAt: string;
}

export const usePitchStorage = () => {
  const [savedPitches, setSavedPitches] = useState<SavedPitch[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('saved-pitches');
    if (saved) {
      setSavedPitches(JSON.parse(saved));
    }
  }, []);

  const savePitch = (name: string, projectData: ProjectData, pitch: GeneratedPitch, template: string = 'default') => {
    const newPitch: SavedPitch = {
      id: Date.now().toString(),
      name,
      projectData,
      pitch,
      template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...savedPitches, newPitch];
    setSavedPitches(updated);
    localStorage.setItem('saved-pitches', JSON.stringify(updated));
    return newPitch.id;
  };

  const updatePitch = (id: string, updates: Partial<SavedPitch>) => {
    const updated = savedPitches.map(pitch => 
      pitch.id === id 
        ? { ...pitch, ...updates, updatedAt: new Date().toISOString() }
        : pitch
    );
    setSavedPitches(updated);
    localStorage.setItem('saved-pitches', JSON.stringify(updated));
  };

  const deletePitch = (id: string) => {
    const updated = savedPitches.filter(pitch => pitch.id !== id);
    setSavedPitches(updated);
    localStorage.setItem('saved-pitches', JSON.stringify(updated));
  };

  const loadPitch = (id: string) => {
    return savedPitches.find(pitch => pitch.id === id);
  };

  return {
    savedPitches,
    savePitch,
    updatePitch,
    deletePitch,
    loadPitch
  };
};
