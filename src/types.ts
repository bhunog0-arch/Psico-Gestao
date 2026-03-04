export interface Patient {
  id: string;
  name: string;
  age: number;
  complaint: string;
  status?: 'active' | 'discharged' | 'waiting';
  created_at?: string;
}

export interface ConceptualizationRecord {
  id: string;
  patient_id: string;
  input_data: string;
  result_text: string;
  created_at: string;
}

export interface RPGEvent {
  title: string;
  description: string;
  situacao: string;
  pensamento: string;
  emocao: string;
  intensidade: number;
}

export interface TCCCard {
  id: string;
  name: string;
  category: 'Cognitiva' | 'Comportamental' | 'Emocional' | 'Social';
  description: string;
}

export interface RPGStatus {
  ansiedade: number;
  confianca: number;
  evitacao: number;
  progresso: number;
}
