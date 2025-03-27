export interface Location {
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  virtual?: boolean;
  meetingLink?: string;
  metadata?: any;
}
