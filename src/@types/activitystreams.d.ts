export type Person = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Person";
  preferredUsername: string;
  inbox: string;
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
  inReplyTo: string | undefined;
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
  type: "Accept";
  id: string;
  actor: string;
  object: FollowActivity;
};

export type Activity = FollowActivity | AcceptActivity;
