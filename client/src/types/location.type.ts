export interface ILocation {
  address?: string;
  name?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  virtual?: boolean;
  meetingLink?: string;
  metadata?: any;
}
