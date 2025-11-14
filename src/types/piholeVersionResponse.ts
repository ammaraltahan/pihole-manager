export interface PiHoleVersionResponse {
  version: {
    core: PiHoleVersionComponent;
    web: PiHoleVersionComponent;
    ftl: PiHoleVersionComponent;
    docker: PiHoleVersionDockerComponent;
  };
  took: number;
}

export interface PiHoleVersionComponent {
  local: PiHoleVersionDetails | null;
  remote: PiHoleVersionRemoteDetails | null;
}

export interface PiHoleVersionDetails {
  version: string;
  branch: string;
  hash: string;
  date?: string;
}

export interface PiHoleVersionRemoteDetails {
  version: string;
  hash: string;
}

export interface PiHoleVersionDockerComponent {
  local: null;
  remote: null;
}
