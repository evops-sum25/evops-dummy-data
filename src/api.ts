import { Client, createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import {
  EventService,
  TagService,
  UserService,
} from "./gen/evops/api/v1/api_pb.ts";

export interface Api {
  eventService: Client<typeof EventService>;
  tagService: Client<typeof TagService>;
  userService: Client<typeof UserService>;
}

export async function initApi(apiUrl: URL): Promise<Api> {
  const grpcWebTransport = createGrpcWebTransport({
    baseUrl: apiUrl.toString(),
  });

  return {
    eventService: createClient(EventService, grpcWebTransport),
    tagService: createClient(TagService, grpcWebTransport),
    userService: createClient(UserService, grpcWebTransport),
  };
}
