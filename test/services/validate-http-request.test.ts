import {
  validateDigest,
  validateHttpRequest,
} from "../../src/services/validate-http-request";
import httpMocks from "node-mocks-http";

describe(validateDigest, () => {
  test("digest が正しいとき true を返す", async () => {
    // Pleroma から送信されたリクエストの一つを再現したもの
    const REQUEST_BODY = `{"@context":["https://www.w3.org/ns/activitystreams","http://pleroma.local/schemas/litepub-0.1.jsonld",{"@language":"und"}],"actor":"http://pleroma.local/users/foobar","context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/7fc0472e-39d2-4dd6-8ec7-2436bb4ae9c3","object":{"actor":"http://pleroma.local/users/foobar","bcc":[],"bto":[],"cc":[],"context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/96c7bf69-41d9-49b2-a941-167b5dae4e06","object":"http://sapakan.local/accounts/test2","published":"2023-05-30T16:48:42.910881Z","state":"cancelled","to":["http://sapakan.local/accounts/test2"],"type":"Follow"},"published":"2023-05-30T16:48:42.910864Z","to":["http://sapakan.local/accounts/test2"],"type":"Undo"}`;
    const buffer = Buffer.from(REQUEST_BODY);

    const req = httpMocks.createRequest({
      method: "POST",
      url: "/accounts/test2/inbox",
      headers: {
        host: "sapakan.local",
        date: "Tue, 30 May 2023 16:48:42 GMT",
        signature: `keyId="http://pleroma.local/users/foobar#main-key",algorithm="rsa-sha256",headers="(request-target) content-length date digest host",signature="LAC7/pVvsu8uHWJJiX+RrKDGVv5gVE1Mo13WvnnZYScRUnzLWL6yLpYXsWJe/3VVfB5ohW3zYeSS0zmk744U3zwYMEwpEBCuZ8x1sd0wUeBn7SQcj2M8yQSRVLU9KW0aaTFJjCTFILZaWaYIQUUja4uZ+8OIPhWmgMRO+c3ym+BaD3LMxFlvP0uLROLCvXOGq6PDbKJxQx9etRBY1dSDSD8LO1h1RexlRIRii61lpSAUZ4QOUaltqXMedWVem8096U70xzCDJv5d8s7r7zWC3UGmvkQ4rA+8UqD0/RP2J9PxGURlJrvLvv04QuBb4PB/oNvI098YyJPnngF2SvkPZg=="`,
        "content-length": "830",
        digest: "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
      },
    });
    req.body = buffer;

    expect(
      validateDigest(
        "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
        buffer
      )
    ).toBe(true);
  });

  test("digest が正しくないとき false を返す", async () => {
    const REQUEST_BODY = `unexpected_content`;
    const buffer = Buffer.from(REQUEST_BODY);

    const req = httpMocks.createRequest({
      method: "POST",
      url: "/accounts/test2/inbox",
      headers: {
        host: "sapakan.local",
        date: "Tue, 30 May 2023 16:48:42 GMT",
        signature: `keyId="http://pleroma.local/users/foobar#main-key",algorithm="rsa-sha256",headers="(request-target) content-length date digest host",signature="LAC7/pVvsu8uHWJJiX+RrKDGVv5gVE1Mo13WvnnZYScRUnzLWL6yLpYXsWJe/3VVfB5ohW3zYeSS0zmk744U3zwYMEwpEBCuZ8x1sd0wUeBn7SQcj2M8yQSRVLU9KW0aaTFJjCTFILZaWaYIQUUja4uZ+8OIPhWmgMRO+c3ym+BaD3LMxFlvP0uLROLCvXOGq6PDbKJxQx9etRBY1dSDSD8LO1h1RexlRIRii61lpSAUZ4QOUaltqXMedWVem8096U70xzCDJv5d8s7r7zWC3UGmvkQ4rA+8UqD0/RP2J9PxGURlJrvLvv04QuBb4PB/oNvI098YyJPnngF2SvkPZg=="`,
        "content-length": "830",
        digest: "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
      },
    });
    req.body = buffer;

    expect(
      validateDigest(
        "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
        buffer
      )
    ).toBe(false);
  });
});

describe(validateHttpRequest, () => {
  test("リクエストが正しいとき true を返す", async () => {
    const REQUEST_BODY = `{"@context":["https://www.w3.org/ns/activitystreams","http://pleroma.local/schemas/litepub-0.1.jsonld",{"@language":"und"}],"actor":"http://pleroma.local/users/foobar","context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/7fc0472e-39d2-4dd6-8ec7-2436bb4ae9c3","object":{"actor":"http://pleroma.local/users/foobar","bcc":[],"bto":[],"cc":[],"context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/96c7bf69-41d9-49b2-a941-167b5dae4e06","object":"http://sapakan.local/accounts/test2","published":"2023-05-30T16:48:42.910881Z","state":"cancelled","to":["http://sapakan.local/accounts/test2"],"type":"Follow"},"published":"2023-05-30T16:48:42.910864Z","to":["http://sapakan.local/accounts/test2"],"type":"Undo"}`;
    const buffer = Buffer.from(REQUEST_BODY);

    const req = httpMocks.createRequest({
      method: "POST",
      url: "/accounts/test2/inbox",
      headers: {
        host: "sapakan.local",
        date: "Tue, 30 May 2023 16:48:42 GMT",
        signature: `keyId="http://pleroma.local/users/foobar#main-key",algorithm="rsa-sha256",headers="(request-target) content-length date digest host",signature="LAC7/pVvsu8uHWJJiX+RrKDGVv5gVE1Mo13WvnnZYScRUnzLWL6yLpYXsWJe/3VVfB5ohW3zYeSS0zmk744U3zwYMEwpEBCuZ8x1sd0wUeBn7SQcj2M8yQSRVLU9KW0aaTFJjCTFILZaWaYIQUUja4uZ+8OIPhWmgMRO+c3ym+BaD3LMxFlvP0uLROLCvXOGq6PDbKJxQx9etRBY1dSDSD8LO1h1RexlRIRii61lpSAUZ4QOUaltqXMedWVem8096U70xzCDJv5d8s7r7zWC3UGmvkQ4rA+8UqD0/RP2J9PxGURlJrvLvv04QuBb4PB/oNvI098YyJPnngF2SvkPZg=="`,
        "content-length": "830",
        digest: "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
      },
    });
    req.body = buffer;

    const publicKey =
      "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo4Qsd+xnvZ3T5cy+D5Yj\nniEyNd6ruKG0S9qwDDWVyJttHe0wyDRpXRAOlqQDlbCRqZy/7IsaS9BBdXytLQT+\nbjTVemGv6iTCRd69jJhk7o83u4CgsHKpMbSc5GbetF97m5zR81yfQwlG5XcW0Gxx\n0yWJ3kqT6HnaZxgkYyqXoyVng4jQn6HNtaylzzd0bC0va4bDGt2rEIlEIKpk/THx\nfMIqOYl63YwTbW/9susiiIg0zT6g+KI7yV2+5DpNROaAXuVwDf2Rm/HzRnaffgB/\nIukH0Y9r3+6xCUgKMX+5k87qDNxeoh5vw4mViajBWWtg4NTty+Qghwb7rlEvKCkY\nwQIDAQAB\n-----END PUBLIC KEY-----\n\n";

    expect(await validateHttpRequest(req, buffer, { publicKey })).toBe(true);
  });

  test("不正な署名が与えられたとき false を返す", async () => {
    const REQUEST_BODY = `{"@context":["https://www.w3.org/ns/activitystreams","http://pleroma.local/schemas/litepub-0.1.jsonld",{"@language":"und"}],"actor":"http://pleroma.local/users/foobar","context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/7fc0472e-39d2-4dd6-8ec7-2436bb4ae9c3","object":{"actor":"http://pleroma.local/users/foobar","bcc":[],"bto":[],"cc":[],"context":"http://pleroma.local/contexts/237271ba-fe4c-418b-af05-0c7d625f01e3","id":"http://pleroma.local/activities/96c7bf69-41d9-49b2-a941-167b5dae4e06","object":"http://sapakan.local/accounts/test2","published":"2023-05-30T16:48:42.910881Z","state":"cancelled","to":["http://sapakan.local/accounts/test2"],"type":"Follow"},"published":"2023-05-30T16:48:42.910864Z","to":["http://sapakan.local/accounts/test2"],"type":"Undo"}`;
    const buffer = Buffer.from(REQUEST_BODY);

    const req = httpMocks.createRequest({
      method: "POST",
      url: "/accounts/test2/inbox",
      headers: {
        host: "sapakan.local",
        date: "Tue, 30 May 2023 16:48:42 GMT",
        signature: `keyId="http://pleroma.local/users/foobar#main-key",algorithm="rsa-sha256",headers="(request-target) content-length date digest host",signature="invalid_signature"`,
        "content-length": "830",
        digest: "SHA-256=D/gTKeuUJnlOku1R3owOw9VhzftxA2w2gAcnsEM5o4g=",
      },
    });
    req.body = buffer;

    const publicKey =
      "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo4Qsd+xnvZ3T5cy+D5Yj\nniEyNd6ruKG0S9qwDDWVyJttHe0wyDRpXRAOlqQDlbCRqZy/7IsaS9BBdXytLQT+\nbjTVemGv6iTCRd69jJhk7o83u4CgsHKpMbSc5GbetF97m5zR81yfQwlG5XcW0Gxx\n0yWJ3kqT6HnaZxgkYyqXoyVng4jQn6HNtaylzzd0bC0va4bDGt2rEIlEIKpk/THx\nfMIqOYl63YwTbW/9susiiIg0zT6g+KI7yV2+5DpNROaAXuVwDf2Rm/HzRnaffgB/\nIukH0Y9r3+6xCUgKMX+5k87qDNxeoh5vw4mViajBWWtg4NTty+Qghwb7rlEvKCkY\nwQIDAQAB\n-----END PUBLIC KEY-----\n\n";

    expect(await validateHttpRequest(req, buffer, { publicKey })).toBe(false);
  });
});
