export class Sessions {
  id: string;
  userId: string;
  lastSession: string;
  appVersion?: string;
  platform?: string;
  ip?: string;
  geo?: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    lastSession?: string,
    appVersion?: string,
    platform?: string,
    ip?: string,
    geo?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.lastSession = lastSession || new Date().toISOString();
    this.appVersion = appVersion;
    this.platform = platform;
    this.ip = ip;
    this.geo = geo;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
