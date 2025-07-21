import { Client, createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import {
  AuthService,
  EventService,
  TagService,
} from "./gen/evops/api/v1/api_pb.ts";

export interface Api {
  url: URL;
  eventService: Client<typeof EventService>;
  tagService: Client<typeof TagService>;
  authService: Client<typeof AuthService>;
}

export async function initApi(apiUrl: URL): Promise<Api> {
  const grpcWebTransport = createGrpcWebTransport({
    baseUrl: apiUrl.toString(),
  });
  return {
    url: apiUrl,
    authService: createClient(AuthService, grpcWebTransport),
    eventService: createClient(EventService, grpcWebTransport),
    tagService: createClient(TagService, grpcWebTransport),
  };
}
