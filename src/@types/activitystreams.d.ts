export type Person = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Person";
  preferredUsername: string;
  inbox: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
};

export type Note = {
  "@context": "https://www.w3.org/ns/activitystreams";
  type: "Note";
  id: string;
  content: string;
  published: string;
  source: {
    content: string;
    mediaType: string;
  };
  summary: "";
  actor: string;
  attributedTo: string;
  to: string[];
  cc: string[];
  url: string;
  inReplyTo?: string;
};

export type FollowActivity = {
  "@context": string | (string | object)[];
  type: "Follow";
  id: string;
  actor: string;
  object: string;
};

export type AcceptActivity = {
  "@context": string | (string | object)[];
  id: string;
  type: "Accept";
  actor: string;
  object: Activity;
};

export type UndoActivity = {
  "@context": string | (string | object)[];
  id: string;
  type: "Undo";
  actor: string;
  object: Activity;
};

export type CreateActivity = {
  "@context": string | (string | object)[];
  type: "Create";
  id: string;
  actor: string;
  published: string;
  object: Note;
  // memo: to, cc は無くても CreateActivity を Pleroma に配送できた
};

export type Activity =
  | FollowActivity
  | AcceptActivity
  | UndoActivity
  | CreateActivity;
