export type Person = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Person";
  preferredUsername: string;
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
