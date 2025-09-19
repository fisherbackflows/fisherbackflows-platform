declare global {
  let mockTeamSessions: {
    [sessionToken: string]: {
      user: {
        id: string;
        email: string;
        role: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
      };
      expiresAt: number;
    };
  } | undefined;
}

export {};