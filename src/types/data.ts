export interface Friend {
  name: string;
  avatar: string;
  description: string;
  url: string;
}

export interface FriendsData {
  friends: Friend[];
}
