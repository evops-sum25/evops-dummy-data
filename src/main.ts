import { MessageInitShape } from "@bufbuild/protobuf";
import { type Api, initApi } from "./api.ts";
import { loadConfig } from "./config.ts";
import type {
  NewEventFormSchema,
  Tag,
  User,
} from "./gen/evops/api/v1/api_pb.ts";

await main();
async function main(): Promise<void> {
  const config = loadConfig();
  const api = await initApi(config.apiUrl);
  createEvents(api);
}

async function pushImage(
  api: Api,
  eventId: string,
  imageUrl: string,
): Promise<string> {
  const route = new URL(`v1/events/${eventId}/images`, api.url);
  const requestBody = await createMultipartRequest(new URL(imageUrl));
  return await fetch(route, { method: "POST", body: requestBody }).then(
    async (response) => (await response.json())["image_id"],
  );
}

async function createMultipartRequest(imageUrl: URL): Promise<FormData> {
  const formData = new FormData();
  formData.append(
    "image",
    await fetch(imageUrl).then((response) => response.blob()),
  );
  return formData;
}

async function createTags(api: Api) {
  async function createTag(name: string, aliases: string[]): Promise<Tag> {
    const response = await api.tagService.create({ form: { name, aliases } });
    return await api.tagService
      .find({ id: response.tagId })
      .then((it) => it.tag!);
  }
  return {
    study: await createTag("study", ["university", "exams", "learning"]),
    food: await createTag("food", ["pizza", "tea", "lunch", "eating"]),
    games: await createTag("games", ["videogames", "esports", "cybersport"]),
    "data-science": await createTag("data-science", []),
    "job-fair": await createTag("job-fair", []),
    volunteering: await createTag("volunteering", []),
    "language-learning": await createTag("language-learning", []),
    "machine-learning": await createTag("machine-learning", []),
    quiz: await createTag("quiz", []),
    "master-class": await createTag("master-class", []),
    "computer-science": await createTag("computer-science", []),
    workshop: await createTag("workshop", []),
    cybersecurity: await createTag("cybersecurity", []),
    music: await createTag("music", []),
    forum: await createTag("forum", []),
    contest: await createTag("contest", []),
    dance: await createTag("dance", []),
    hackathon: await createTag("hackathon", []),
    concert: await createTag("concert", []),
    ball: await createTag("ball", []),
    mathematics: await createTag("mathematics", []),
    talk: await createTag("talk", []),
    olympiad: await createTag("olympiad", []),
    design: await createTag("design", []),
    game: await createTag("game", []),
    art: await createTag("art", []),
    conference: await createTag("conference", []),
    "club-meeting": await createTag("club-meeting", []),
    business: await createTag("business", []),
    lecture: await createTag("lecture", []),
    festival: await createTag("festival", []),
    programming: await createTag("programming", []),
    sports: await createTag("sports", []),
    "artificial-intelligence": await createTag("artificial-intelligence", []),
    science: await createTag("science", []),
    seminar: await createTag("seminar", []),
    physics: await createTag("physics", []),
    internship: await createTag("internship", []),
    robotics: await createTag("robotics", []),
    startups: await createTag("startups", []),
    party: await createTag("party", []),
  };
}

async function createUsers(api: Api) {
  async function createUser(api: Api, name: string): Promise<User> {
    const response = await api.userService.create({
      form: { name },
    });
    return await api.userService
      .find({ id: response.userId })
      .then((it) => it.user!);
  }

  return {
    aleksandr: await createUser(api, "Aleksandr Isupov"),
    arsen: await createUser(api, "Arsen Galiev"),
    asqar: await createUser(api, "Asqar Arslanov"),
    egor: await createUser(api, "Egor Pustovoytenko"),
    ilya: await createUser(api, "Ilya-Linh Nguen"),
    maksim: await createUser(api, "Maksim Ilin"),
    ramil: await createUser(api, "Ramil Shakirzyanov"),
    o4u: await createUser(api, "Opportunities For You"),
  };
}

async function createEvents(api: Api): Promise<void> {
  async function createEvent(
    api: Api,
    form: MessageInitShape<typeof NewEventFormSchema>,
    imageUrls: string[],
    sleepMs: number = 500,
  ): Promise<void> {
    const response = await api.eventService.create({ form });
    imageUrls.map(async (imageUrl) => {
      await pushImage(api, response.eventId, imageUrl);
    });
    await new Promise((r) => setTimeout(r, sleepMs));
  }

  const users = await createUsers(api);
  const tags = await createTags(api);

  {
    await createEvent(
      api,
      {
        authorId: users.ilya.id,
        title: "Valorant Training",
        description:
          "Come if you want to become a candidate for master of sport!",
        tagIds: [tags.games.id],
        withAttendance: true,
      },
      [
        "https://img.redbull.com/images/c_crop,x_321,y_0,h_1049,w_787/c_fill,w_450,h_600/q_auto:low,f_auto/redbullcom/2020/4/19/d1jrdrpou7hvstulfozq/red-bull-campus-clutch-valorant-agents-phoenix-jett",
      ],
    );
  }
  {
    await createEvent(
      api,
      {
        authorId: users.asqar.id,
        title: "Pelmeni Evening",
        description: "You may also bring varenyky!",
        tagIds: [tags.food.id],
        withAttendance: false,
      },
      [
        "https://i5.walmartimages.com/seo/Emotional-Support-Dumplings-Soft-Food-Plushies-by-What-Do-You-Meme_cfd8684d-7d17-4bc1-adaf-9fbdd1c1ce73.6ecf79a51349d45f0ccfedffc0e947e6.jpeg",
      ],
    );
  }
  {
    await createEvent(
      api,
      {
        authorId: users.aleksandr.id,
        title: "Solving interesting problems",
        description:
          "We’re gonna be solving interesting linear algebra problems. Every attendee gets a free éclair!",
        tagIds: [tags.study.id, tags.food.id],
        withAttendance: true,
      },
      [
        "https://pbs.twimg.com/media/FSl59RZVsAA2Fw4.jpg"
      ],
    );
  }
}
