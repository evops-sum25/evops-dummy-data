import { MessageInitShape } from "@bufbuild/protobuf";
import { type Api, initApi } from "./api.ts";
import { loadConfig } from "./config.ts";
import {
  type AuthTokens,
  type NewEventFormSchema,
  type Tag,
} from "./gen/evops/api/v1/api_pb.ts";

await main();
async function main(): Promise<void> {
  const config = loadConfig();
  const api = await initApi(config.apiUrl);
  createEvents(api);
}

async function signUp(
  api: Api,
  login: string,
  displayName: string,
  password: string,
): Promise<AuthTokens> {
  const response = await api.authService.signUp({
    form: { login, displayName, password },
  });

  if (!response.tokens) {
    throw new Error("No tokens in response");
  }

  return response.tokens;
}

async function pushImage(
  api: Api,
  access_token: string,
  eventId: string,
  imageUrl: string,
): Promise<string> {
  const route = new URL(`v1/events/${eventId}/images`, api.url);
  const requestBody = await createMultipartRequest(new URL(imageUrl));

  return await fetch(route, {
    method: "POST",
    body: requestBody,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }
    return (await response.json())["image_id"];
  });
}

async function createMultipartRequest(imageUrl: URL): Promise<FormData> {
  const formData = new FormData();
  formData.append(
    "image",
    await fetch(imageUrl).then((response) => response.blob()),
  );
  return formData;
}

async function createTags(api: Api, token: string) {
  async function createTag(name: string, aliases: string[]): Promise<Tag> {
    const response = await api.tagService.create(
      { form: { name, aliases } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
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

async function createEvents(api: Api): Promise<void> {
  async function createEvent(
    api: Api,
    form: MessageInitShape<typeof NewEventFormSchema>,
    imageUrls: string[],
    sleepMs: number = 100,
    maxRetries: number = 3,
  ): Promise<void> {
    while (true) {
      let eventId: string | null = null;
      try {
        const response = await api.eventService.create(
          { form },
          { headers: { Authorization: `Bearer ${tokens.access}` } },
        );
        eventId = response.eventId;
        for (const imageUrl of imageUrls) {
          let retryCount = 0;
          let success = false;

          while (!success && retryCount < maxRetries) {
            try {
              await pushImage(api, tokens.access, eventId, imageUrl);
              await new Promise((r) => setTimeout(r, sleepMs));
              success = true;
            } catch (e) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw new Error(
                  `Failed to upload image after ${maxRetries} attempts: ${imageUrl}`,
                );
              }
            }
          }
        }
        break;
      } catch (e) {
        console.error("Event processing error:", e);
      }
    }
  }

  const tokens = await signUp(api, "o4u_user", "04u", "sasha123");
  const tags = await createTags(api, tokens.access);

  await createEvent(
    api,
    {
      title: "IBC 2019 Volunteer Opportunities!",
      description:
        "📣Hi there! Want any of these?\n\nStudent Affairs are looking for volunteers to help with administrative work \n\n- today 15:00-17:00 or\n- tomorrow in 319 from 14:00 to 16:00.\n\n✅Your efforts will be compensated with:\n\n- IBC 2019 T-shirt\n- tea & cookies, if you like\n- friendliness of 319 team!\n\n👉If you may help please message ",
      tagIds: [tags["volunteering"].id, tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2208@04-12-2024_14-44-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_692@05-04-2022_15-40-38.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_928@07-12-2022_15-43-11.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_694@06-04-2022_09-00-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Bonjour! \'est la vie.. Croissant.",
      description:
        "Bonjour! Ça va?\nС\'est la vie.. \nCroissant.\n\n📣If these words sound familiar to you, then maybe you know something about French Language 😉🇫🇷\n\n Language Club invites you to the open French lesson for beginners by Aliance Francaise 😍\n\n🕢 1️⃣8️⃣:0️⃣0️⃣ in room 320!\n\n‼️Lesson will be held in Russian\n\nDo not hesitate to contact  or  with any questions.",
      tagIds: [tags["language-learning"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Innopolis is preparing for the New Year",
      description:
        "📣On December 14, comedian Vladimir Marconi arrives in Innopolis. He, together with the mayor\'s office and his film crew, will shoot a video about residents of the city preparing for the New Year.\n\n‼️🤩If you want to work in this project, message  by the end of Friday, November 22.",
      tagIds: [tags["internship"].id, tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1317@05-09-2023_12-00-53.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2368@10-03-2025_20-02-39.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "ICPC Winter Camp at Innopolis University",
      description:
        "‼️Want to upgrade your programming skills? We are glad to announce ourat Innopolis University, which will happen from 14 to 18 December! \n\nOur first ICPC winter camp is designed for  teams and will be held in December right after the final exams at Innopolis University. To take part:\n\n1. Have Timus Online account on .\n2. Solve 50 tasks on Timus Online by 6 December.\n3. Register for the camp .\n\n✅Camp curriculum for  will include 3 and 5 hours contests, problem analysis and upsolving practice. Even if you’re not in ICPC club yet you can join our camps now! \n\n👉Any questions: ",
      tagIds: [tags["programming"].id, tags["computer-science"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Soft Skills School — Sberbank Russia",
      description:
        "📣We invite you to the Soft Skills School, which will be conducted by business coaches from Sberbank Russia along with 319 team. The program will include personal meta-competence assessment, business games, trainings and personal development planning.\n\nTo apply please follow the  and provide detailed answers to specified questions by 6 December. Selection process will determine successful candidates, who will be notified by 13 December. \n\n📍Event\'s venue: trying to sort something outside IU\n📌School’s time: 17-19 January, 9am-6pm\n🗣Event language: Russian.",
      tagIds: [tags["business"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2069@09-10-2024_09-36-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "ML, VRAR, IoT, RPA, Robots",
      description:
        "20-22 December. Moscow. \n\nML, VR/AR, IoT, RPA, Robots, GameDev\n📲 ",
      tagIds: [
        tags["conference"].id,
        tags["hackathon"].id,
        tags["artificial-intelligence"].id,
        tags["machine-learning"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Dance Master Classes(Salsa, Bachata, Hip-Ho",
      description:
        "💃💃 \n\nFinals are finally over 🥳 and now it\'s time to chill 🥂 \n❗️STREET and SOCIAL DANCE clubs invite you to the 💥 \nIs the place where you can enjoy watching dance performances 👯‍♀️ learn the bacis of different dances 🔥 and have fun on the disco 👻\n\n👉 Dance Master Classes(Salsa, Bachata, Hip-Hop) 💃🕺\n👉 Performance show 👯‍♀️\n👉 Free Snacks & Drinks🍿🍸\n👉 DJ 😎🔥\n👉 Dance floor 🤩\n\n🕖 December 12th\n      1️⃣9️⃣:0️⃣0️⃣ ➡️ 2️⃣3️⃣:0️⃣0️⃣\n📍Main Hall, Innopolis University\n\n👻 SO SHAKE IT OFF 👻",
      tagIds: [tags["dance"].id, tags["music"].id, tags["master-class"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_668@19-03-2022_14-57-22.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: '"Program the Future" contest from GS Labs',
      description:
        '🏆"Program the Future" contest from GS Labs research & development centre.\n\nOnline selection stage lasts until 10 January. Second stage will happen from 3 Feb to 2 Mar. The final will take place in Gusev on 22 April.\n \n💰First place prize - 300 000 rubles.\n\nThe task: invent and implement an idea for StingrayTV platform using JavaScript. StingrayTV is a modern interactive platform that offers a wide spectrum of products for digital environment creation.\n\n👉More info and apply .',
      tagIds: [
        tags["contest"].id,
        tags["programming"].id,
        tags["computer-science"].id,
        tags["hackathon"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1674@13-03-2024_09-35-25.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1562@01-02-2024_18-30-11.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_513@28-10-2021_15-09-10.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Youth Labour Pool (олоден ад",
      description:
        "📣Representatives of Молодежный Кадровый Потенциал are arriving to Innopolis on Friday at 12:00 to present the project and answer any questions. Event language: Russian.\n\n✅📖Youth Labour Pool (Молодежный Кадровый Потенциал) - is an education program for those who want to make a difference in the Republic of Tatarstan. This project is now recruiting young and ambitious people to offer:\n\n▪️ free non-formal education program\n▪️ acquaintance with successful Tatarstan Republic leaders and their projects\n▪️ open dialogue with heads of Tatarstan Republic\n▪️ your competence assessment\n▪️ ways to support ideas of the youth\n\n👉More info: ",
      tagIds: [
        tags["seminar"].id,
        tags["conference"].id,
        tags["workshop"].id,
        tags["lecture"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Regional Grant Contest by Youth Affairs Ministry of Tatarstan",
      description:
        "🚀 Regional Grant Contest by Youth Affairs Ministry of Tatarstan: build a social project for kids or youth and win support up to 300 000 rubles.\n\n‼️Participants: Russian citizens 18-30 y/o\n👉More info & apply: \n📌Deadline: 11 January",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_449@13-09-2021_16-44-40.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2369@11-03-2025_09-06-34.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1168@27-04-2023_16-45-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Dear Students! Soon it\'s your day!",
      description:
        "📣Dear Students! Soon it\'s your day!\n\n🖐Traditionally, in the end of January, we reward outstanding students at the official ceremony followed by the noisy party in the bar. To conduct the event we are looking for:\n\n👩‍🦰 Three stage assistants \n🎛 Audio assistant\n🎤 Master of ceremonies\n\n📌The event will take place on Thursday, 23 Jan, at 17:30 and will last for one hour.\n\n👉If you may help please message ",
      tagIds: [tags["party"].id, tags["volunteering"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1547@30-01-2024_16-57-59.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1793@27-05-2024_13-33-35.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1619@28-02-2024_16-30-31.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "How to live in Innopolis?",
      description:
        "📣Want to  life in Innopolis? \n\nAttend a workshop session in Technopark tomorrow to help us make Innopolis a comfortable place that will meet all possible expectations!\n\n⭐️Main heroes of the event: you, who will share your experiences and views. \n💯Main aim: detect current barriers, challenges and pains to eliminate them.\n\n📌Tomorrow, 25 Jan, 11:00-15:30\n🍩Coffee break\n👉To sign up please message ",
      tagIds: [
        tags["workshop"].id,
        tags["volunteering"].id,
        tags["seminar"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1904@12-07-2024_13-33-15.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Low Level Programming Club presents a brand-new workshop: !",
      description:
        "🏃‍♀️Low Level Programming Club🌴 presents a brand-new workshop: \n\n«!\n\n🔵 You\'ll learn about the nRF52, Bluetooth-enables family of devices based on the ARM processors \n🔵 Find out differences and similarities with Arduino devices, also popular in the DIY field \n🔵 Learn different application possibilities and ways to program devices!\n\n🗓 Saturday, January 25th\n📍 Auditorium 318, 15:00\n🇬🇧 Workshop will be conducted in English\n\nJoin us at ",
      tagIds: [tags["workshop"].id, tags["programming"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Digital culture in Russia in the future?",
      description:
        "📣Want to find out what will digital culture in Russia look like in the future? Come along and discuss it with:\n\n- all Culture Ministers of Volga regions\n- Vice-prime minister of Tatarstan Republic\n- Vice-minister of Culture of Russian Federation\n\n📌Thursday, 13:00\n📌Reading Hall, 1st floor\n‼️Language: Russian\n\n👉 ",
      tagIds: [tags["conference"].id, tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_861@25-10-2022_10-37-46.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "       ",
      description:
        "📣\n\n📌14 Feb, 19:00, room 313\n❤️Evening\'s topic: .\n\nAny way you want it! You can read a poem/prose, sing/play a song or perform a sketch. \n\n👉Register  to be included into the program. After that join \n\n👤Any questions: .\n🇷🇺Most performances are in Russian\n\n🔥Do not miss one of the university’s most atmospheric events!\n\n❤️",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_531@18-11-2021_11-00-41.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Language Overview & Course Structure",
      description:
        "📣The first meeting will consist of the language overview and course structure, thus requires NO background knowledge, so everyone is welcome!! \n\n📌Monday, Feb 3, 18:00 - 20:00\n📍Room 303.\n\n👉Contacts:  or ",
      tagIds: [
        tags["language-learning"].id,
        tags["seminar"].id,
        tags["workshop"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1616@26-02-2024_12-30-43.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1615@25-02-2024_11-30-35.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Are you willing to come?",
      description:
        "📣  👑🎲🥳\n\n☘️ It will most probably take place during one of the Tabletop Games Club meetings on . Please express your desire to take part in the . 📋\n\n— Are you willing to come? 🚶‍♂️\n",
      tagIds: [tags["club-meeting"].id, tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_911@27-11-2022_13-00-45.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1130@09-04-2023_11-15-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1572@06-02-2024_14-30-48.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1387@16-10-2023_12-50-20.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: 'Inno Toastmasters - Where Leaders are Made"',
      description:
        '📣"Inno Toastmasters - Where Leaders are Made"\n\n🎩 Do you want to practice public speaking, improve your communication and build leadership skills? With Toastmasters, you can break barriers, not your budget.\n\n🔥 Today we are going to have public speaking event and the best part is we all can participate. We will have prepared speeches, assessments and of course table topics!\n\n👉Feel free to join  and advise more suitable hours for further events.\n\n📌 Where: Room 106\n📌 When:  Today, 19:00',
      tagIds: [tags["club-meeting"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_953@20-12-2022_18-02-10.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1050@02-03-2023_12-00-55.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1140@13-04-2023_15-00-27.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1389@16-10-2023_18-31-04.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Invitation to Innopolis University Event Project Contest",
      description:
        "🚀 - apply to implement your event/project at Innopolis University this semester. \n\nFrom now, if your project requires support from 10k rubles and more, you have to defend your idea at the contest. No events will be held without preliminary project defense at the contest. More info & . \n\nProject examples: Anime Fest, International Fair, Photo Exhibition, Drone Race, etc.\n\n📌Application deadline  After that all applicants will have 1,5 weeks to prepare project\'s presentation to defend it at the jury panel. Questions: ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_875@03-11-2022_11-07-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1710@01-04-2024_11-36-42.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis Open olympiad in Informatic",
      description:
        "📣 will happen on Saturday, 22 Feb, at 19:30 as part of Innopolis Open olympiad in Informatics. \n\n🍿This time it\'ll be more modest, but cozy and homely event, which will more likely be held in the Reading Hall, 1st floor.\n\n✋👉Please message  if you want to be included in the program. Be ready to attend practice one evening before if you require to test technical or musical equipment.",
      tagIds: [
        tags["computer-science"].id,
        tags["olympiad"].id,
        tags["programming"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2483@22-04-2025_16-03-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Is looking for ambitious projects in Kazan",
      description:
        "‼️‼️\n\n🚀. Drown yourself into specialized education program and sell your project to real corporation. Get practical experience, investment and network opportunities. Many industry fields presented.\n\n👉Register your project and attend the event on 20 Feb in Kazan. More info .\n\n🚀 is looking for ambitious projects in ten different forum directions. If you have an idea, it may be advanced and put in action through offered grants, education programs and partnerships. \n\n👉More info may be found on official website. Register your project  by 1 March.",
      tagIds: [
        tags["forum"].id,
        tags["conference"].id,
        tags["seminar"].id,
        tags["startups"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_759@07-06-2022_17-12-38.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1537@27-01-2024_18-31-14.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_955@22-12-2022_17-23-43.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1681@14-03-2024_14-01-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "How to implement an event project at Innopolis University",
      description:
        "🚀 - apply to implement an event/project aimed at developing life at Innopolis University this semester. Deadline extended: 13/02\n\nFrom now, if your project requires support from 10k rubles and more, you have to defend your idea at the contest. No events will be held without preliminary project defense at the contest. More info & . \n\nProject examples: Anime Fest, International Fair, Photo Exhibition, Drone Race, etc.\n\n📌Application deadline February 13 After that all applicants will have 1,5 weeks to prepare project\'s presentation to defend it at the jury panel. Questions: ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_895@15-11-2022_13-16-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Embedded and System Programming at the Auditorium",
      description:
        "🎮 , originally known as FamiCom in Japan or by it\'s clone\'s name Dendy in post-Soviet countries, has brought Video Game Consoles back from the dead and revolutionized them. Many incredible games originated on the NES, with many clever programmers pushing the limits of the small box to it\'s extremes.\n\nJoin us , on , at  at auditorium ! We will take a deep dive into the guts of the legendary gaming console, and discuss aspects of emulating it\'s games! 🕹\n\nJoin us at🌴 for updates on this event, announcements of new lectures, workshops and talks.\n\nWe also discuss the world of Embedded and System programming, and wait for you to share your projects and interests with us!",
      tagIds: [
        tags["conference"].id,
        tags["seminar"].id,
        tags["lecture"].id,
        tags["talk"].id,
        tags["master-class"].id,
        tags["programming"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "When: Today, 20:30 Where: Sport Complex, Big Hall",
      description:
        "🏐\n\n📌When: Today, 20:30\n📌Where: Sport Complex, Big Hall",
      tagIds: [tags["sports"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Evening\'s topic: . Any way you want it!",
      description:
        "📣\n\n📌❤️Evening\'s topic: .\n\n🙋‍♀️Any way you want it! You can read a poem/prose, sing/play a song or perform a sketch. \n\n👉Register  to be included into the program. After that join \n\n👤Any questions: .\n🇷🇺Most performances are in Russian\n\n🔥Do not miss one of the most atmospheric events!\n\n❤️",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2318@19-02-2025_15-46-13.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_763@14-06-2022_16-31-05.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2249@11-01-2025_13-33-46.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Meeting with fellow-students from Tatarstan organized by...",
      description:
        "👨🏼‍🎓 Meeting with fellow-students from Tatarstan organized by World Forum of Tatar Youth ()\n\n🌎 The meeting will have an interactive space where all visitors may get acquainted with local projects and communities.\n\n✅The aim of the meeting is to help fellow-students to adapt in Kazan and become part of city projects.\n\n📆13 February, 16:00\n🗺 КСК КФУ «УНИКС» (concert hall)\n⠀\n▪️TED Talks format\n▪️1000 students\n▪️50 universities from Tatarstan\n▪️Tatar local communities\n▪️Instrumental music",
      tagIds: [tags["music"].id, tags["concert"].id, tags["talk"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2283@11-02-2025_17-26-22.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1134@11-04-2023_17-01-27.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "2nd April 19:00 Entertaining concert program, great music,...",
      description:
        "🌸  🌸\n\n 2nd April 19:00\nEntertaining concert program, great music, partner dances!\n\n❓\nDon’t be shy and ask people you like.\n\n❓\nYou wil have evening trainings 2-3 times in a week. We will learn you step by step!\nAnd also wil help to dress you up.\n\n❓ \nYou can just come dressed up and  be a part. In this case, you will not need a pair.\n\n\n📌 :  (until 29/02)\nFor any questions contact ❤️",
      tagIds: [tags["concert"].id, tags["dance"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1604@20-02-2024_16-25-14.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Sports Festival has started last weekend!!!",
      description:
        "🎯 Sports Festival has started last weekend!!!\nAfter  and  competitions the team of  are the leaders. \n📲 The whole table is  \n\n👋 We are looking for  participants! \nThe competition will be started this Friday,  in Sport complex. \n📲 You may apply ",
      tagIds: [tags["festival"].id, tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2079@15-10-2024_14-26-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Join the first floorball training this Sunday, February 23rd...",
      description:
        "📣 Are you interested in playing floorball? Or maybe you are already an experienced floorball player? We invite  to take part in the Join the first training this Sunday, February 23rd at the Sports complex Gym. The Spartakiad itself will be held on the 22nd of March, so you have plenty of time to get ready and form the teams.\n\nInterested? Contact  \n\n⁉️ What: Floorball training\n⁉️ Where: SC, Gym\n🕟 When: February 23rd, 16:30-18:30",
      tagIds: [
        tags["programming"].id,
        tags["ball"].id,
        tags["sports"].id,
        tags["club-meeting"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_891@09-11-2022_18-29-49.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The Reading Hall, 1st Floor!",
      description:
        "📣  Have a spare evening this Saturday? \nJoin  in the reading hall, 1st floor!\n\n👋 Enjoy performances, club stands, snacks and the cozy atmosphere! ⛹️‍♀️🎾🤹‍♂️🥁\n\nSee you there on Saturday!",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_516@04-11-2021_18-41-32.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1451@20-11-2023_10-17-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1369@06-10-2023_10-42-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Develop engineering solutions for real case in 48 hours",
      description:
        "📣                                                                                                                                                                                                                                                                          🏆Develop engineering solutions for real case in 48 hours and win amazing prizes.                                                                                                            \n🔥You will receive educational lectures, master classes, access to European & Russian investor network and acceleration to companies\' corporate funds.\n\n🌇Where: Saint-Petersburg\n📌When: 20-22 March 2020\n\n👉Interested? More info .",
      tagIds: [
        tags["hackathon"].id,
        tags["contest"].id,
        tags["startups"].id,
        tags["internship"].id,
        tags["programming"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1122@05-04-2023_14-01-54.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Urgent need students to construct the cube for drone...",
      description:
        "🖐 urgently need students to help to construct the cube for drone competition. \n\n💥When: today-tomorrow \n⏰Duration: 4 hours\n📌Where: reading hall, 1st floor\n👉Contact ",
      tagIds: [
        tags["hackathon"].id,
        tags["robotics"].id,
        tags["volunteering"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Developer Student Club at Innopolis University",
      description:
        "🔥 with support of Google plan to open a Developer Student Club based at Innopolis University. \nDSC this is Google program for helping student with learning and getting knowledge. \n\n is about helping students bridge the gap between theory and practice in Google developer technologies. By joining a DSC, students will grow their knowledge in a peer-to-peer learning environment and will build solutions for local businesses and their community.\n\n.",
      tagIds: [tags["computer-science"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_942@15-12-2022_15-02-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "How to solve global social problems by using AI Data",
      description:
        "▪️There are three contest stages: task, decision and implementation.\n▪️Solve global social problems by using technology AI & Data. \n▪️Form IT and Data communities in Russian regions.\n\n📌When: 1st round - from March to May\n👉More info ",
      tagIds: [tags["contest"].id, tags["artificial-intelligence"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1279@03-08-2023_10-30-14.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_786@28-07-2022_17-25-51.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "All-Tatar University Battle!",
      description:
        "🏆We are looking for a  who will compete in March-April in All-Tatar university battle!\n\nYour job will be to register the team and ensure your foreign teammates aren\'t lost!\n\n👉To apply message \n🔥You win if you\'re quick.",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_687@31-03-2022_09-01-12.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Videogames in the Blockchain, influence of Blockchain...",
      description:
        "▪️ Videogames in the Blockchain, influence of Blockchain\n▪️ Crowdfunding and investment in Crypto-games\n▪️ Game development industry basics \n\n😱Prize draw, drinks and snacks are provided\n📌When: March 4, at 18.00\n🌇Where: Innopolis, Technopark, 2nd floor\n👉Register ",
      tagIds: [tags["contest"].id, tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2367@10-03-2025_18-46-32.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Aeroflot CEO advisor Andrey Polozov-Yabl",
      description:
        "📣Guest lecture by Aeroflot CEO advisor, Andrey Polozov-Yablonski on  You will cover:\n\n- Company development within innovation context\n- Effective collaboration with federal bodies\n- Research and development management \n- Intellectual property rights\n- Business digital transformation\n\n🔥Come along, get valuable insights and possibly identify your future career path😎\n\n👉Register 📌March 23, 14:00-16:00\n🇷🇺Language: Russian\n🏛Room 107",
      tagIds: [
        tags["lecture"].id,
        tags["conference"].id,
        tags["seminar"].id,
        tags["business"].id,
        tags["talk"].id,
        tags["job-fair"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Welcome to Innopolis Language Club!",
      description:
        "🇷🇺‼️\n\n✅Last month we announced Russian language lessons for Innopolis University students, as part of IU Language Club!\n\n✅We will start from the alphabet, reading, pronunciation and common phrases! The first meeting will be held on Tuesday, where we\'ll discuss our regular schedule.\n\n📌10th march, 312 room\n📌Time: 17.30-18.00\n\n👉Join our ",
      tagIds: [tags["language-learning"].id, tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1012@11-02-2023_15-07-39.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "BREAKPOINT20 IV all -Russian forum for ambitious",
      description:
        "📣🚀\n\n⚙️BREAKPOINT`20 — IV all -Russian forum for ambitious young leaders of technical specialties, where they will be able to:\n\n- Find out about trends in technology in 2020; \n- Find like-minded people and exchange ideas with other participants who care about the technological future!\n- Communicate with representatives of companies from IT and industry sector (i.e. X5 Retail Group) to discuss potential employment.\n- Develop soft and hard skills!\n\n✅ Participation is free:  \n📅 April 11-12",
      tagIds: [tags["forum"].id, tags["conference"].id, tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2362@07-03-2025_15-29-13.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_711@14-04-2022_17-51-43.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2501@05-05-2025_15-26-49.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Participate in International Fest!",
      description:
        "🔥 Let\'s expose the richness of various traditions, cuisines, crafts and arts!\n\n📌Preliminary date: Saturday, 11 April. \n\nYou can participate in various ways:\n- Cuisine of the world / cooking\n- Dancing / singing performance\n- Traditional dress exposition\n- Crafts master class\n- Anything else?\n\n✅You can participate as a team or on your own. You may present a country or a region of Russia.\n\n‼️We need to get at least 10 countries/regions to make the event happen.\n\n👉Fill the  by Wednesday 9am to take part in International Fest and represent your culture or home place!",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2247@29-12-2024_21-00-12.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1116@02-04-2023_19-00-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2505@07-05-2025_15-05-45.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1427@08-11-2023_17-45-22.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: " осковски осковски",
      description:
        "📣🏀Let\'s support our guys, they will need your presence this Sunday to reach the final!🏀\n\nIf we get 15 supporters, we\'ll organize two-way transport. Put your name  if you wish to be there for our team. Deadline: today 23:59.\n\n📌15 March, 17:30, ДК Московский",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1521@12-01-2024_14-20-12.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1058@06-03-2023_12-30-47.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1089@23-03-2023_10-39-59.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Data scientists Python\'s developers Participate in Final...",
      description:
        "▪️Analysts\n▪️Data scientists\n▪️Python\'s developers \n▪️IT developers\n\n▪️Participate in Final Hackathon\n▪️Prize money\n▪️Job offer from the organizer\'s company\n▪️ Implementation of your project\n▪️Familiarity with experts and the customer market of the Republic\n\n📌When: April 11 – 12\n🌇Where: IT-park, Kazan\n👉Register  till April 8 🔥\n👤Questions: ",
      tagIds: [
        tags["hackathon"].id,
        tags["data-science"].id,
        tags["job-fair"].id,
        tags["programming"].id,
        tags["contest"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "осковски  осковски",
      description:
        "📣\n\nWe got 24 supporters registered to come to the game! Please put your telegram alias  if you will be taking special bus arranged for the match day. Please do it by the end of today.\n\nIt will be one-way trip (Innopolis-Kazan), as presumably most of you will stay in Kazan after the game. Therefore, return bus will not justify its expense.\n\n🏀Max number of supporters: 30 people\n📌Fixture: 15 March, 17:30, ДК Московский\n‼️All registered supporters will be notified about bus departure on Sunday.",
      tagIds: [tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2277@08-02-2025_12-05-59.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "IU - KazBas Camp Sunday, 15 March, 17:30 ",
      description:
        "‼️Last call for students wishing to support our Basketball team this Sunday. Put your telegram alias  if you wish to take the bus to the game. Deadline 13:00.\n\nIU - KazBas Camp\nSunday, 15 March, 17:30\nДК Московский",
      tagIds: [tags["sports"].id, tags["conference"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Reading Room, 1st floor",
      description:
        "📣\n\nWe invite you to join us for a friendly informal meeting, where we will take a look at great, yet underrated novel (let its name be a surprise for now).\n\nWe are going to discuss author\'s works in general, as well as the novel itself, and then enjoy one of our favourite monologues!\n\n📌Saturday, 14.03, 21:00 \n📌Reading Hall, 1st floor",
      tagIds: [tags["talk"].id, tags["club-meeting"].id, tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_469@27-09-2021_20-00-05.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The Best Self-Help Books of All Time",
      description:
        "📣\n\nWe invite you to explore one of the best self-help books of all time together. The introduction session will be led by , after which we\'ll allocate book chapters to individuals/groups who will share their learnings with us in a calm and friendly setting.\n\n👉More info & sign up:  \n\n📌First meeting: Friday, 20 March, 16:00\n🇬🇧Event Language: English",
      tagIds: [
        tags["seminar"].id,
        tags["workshop"].id,
        tags["club-meeting"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_631@16-02-2022_09-01-28.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Digital Olympiad Volga IT20 Gain practical skills in IT Get...",
      description:
        "📣Digital Olympiad “Volga – IT’20”\n\n▪️Gain practical skills in IT\n▪️Get experience exchange\n▪️Obtain business relations\n\n🌇Where: Ulyanovsk\n📌When: 23 – 26 April\n👉Register  by April 1",
      tagIds: [tags["olympiad"].id, tags["business"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "   ",
      description:
        ".\n\n✔️Get teaching and project management experience in design.\n\n📌Work duration:  March 23 -28\n📌Shift Schedule:\n\nMon 13.00 – 16.00\nTue, Wed, Thu 09.00 – 12.00\nFri 09.00 – 18.00 (Hackathon)\nSat 09.00 – 15.00 (final concert)\n\n💸🇷🇺Language: Russian\n👤Questions: \n👉More info & apply ",
      tagIds: [tags["design"].id, tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_843@10-10-2022_12-39-49.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2582@20-06-2025_16-44-10.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1252@13-07-2023_14-00-47.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The best self-help books of all time",
      description:
        "📣We invite you to explore one of the best self-help books of all time together. The introduction class will be led by , after which we\'ll allocate book chapters to individuals/groups who will share their learnings with us in a calm and friendly setting.\n\nThis activity will improve your conversational English, teaching & leadership skills, as well as will potentially lay foundation for discussion/reading club.\n\n👉More info & sign up:  \n\n📌First meeting: Tomorrow, 20 March, 16:00\n🇬🇧Event Language: English",
      tagIds: [
        tags["language-learning"].id,
        tags["workshop"].id,
        tags["seminar"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_704@08-04-2022_19-00-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1864@24-06-2024_18-15-33.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Russian Quiz — Find answers to tricky questions!",
      description:
        "📣\n\nWe invite you to partake in this quiz, find answers to tricky questions and have fun! Teams will be formed randomly, consisting of 3-4 people in each team.\n\n📌Sunday, 13:00 \n🇷🇺Language: Russian\n👉To participate join this  now!",
      tagIds: [tags["quiz"].id, tags["game"].id, tags["language-learning"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2169@19-11-2024_12-00-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_945@16-12-2022_18-01-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2254@23-01-2025_10-19-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2118@28-10-2024_15-58-39.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "May 1, 19:00 Speed typing contest",
      description:
        "📣Another quarantine activity organized by our students: speed typing contest at . We\'ll have two competition categories: Russian and English. \n\nIf you can\'t handle Russian, you\'ll have to use Google Translate Chrome Extension to be able to navigate through the website.\n\n📌May 1, 19:00\n👉More info in ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2576@18-06-2025_10-10-14.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Online hackathon for students during pandemic",
      description:
        "📣While our society tries to maintain self-isolation requirements and stay safe, our students decided to organize an online hackathon. 🔹8 different industry cases\n🔹Hackathon length: 2-6 May\n🔹Team capacity: 3 people max (you may participate alone if you wish)\n\nThis is a great opportunity to make use of your time during pandemic period: learn more about real industry, gain practical experience and enrich your professional portfolio.\n\n👉Available cases and registration are .\n\n📌",
      tagIds: [
        tags["hackathon"].id,
        tags["programming"].id,
        tags["startups"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2312@17-02-2025_12-28-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Hackathon Duration: 2-6 May",
      description:
        "📣 .\n\n👉Check it out .\n\n🔹Hackathon length: 2-6 May\n🔹Team capacity: 3 people max (you may participate alone if you wish)\n\nThis is a great opportunity to make use of your time during pandemic period: learn more about real industry, gain practical experience and enrich your professional portfolio.",
      tagIds: [
        tags["hackathon"].id,
        tags["programming"].id,
        tags["startups"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_892@10-11-2022_13-42-26.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_977@23-01-2023_10-40-15.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Studvesna 2020 Contest Requirements",
      description:
        "📣Studvesna 2020 has released its contest requirements for this year\'s event.\n\nStudvesna is a yearly regional festival of student creative arts. There’ll be several genres, all in online-format: music, dance, original genre, theatre, video, journalism, fashion.\n\n📌Application deadline: 15 May\n✅More info at \n👉If you\'re wishing to apply inbox ",
      tagIds: [
        tags["contest"].id,
        tags["music"].id,
        tags["festival"].id,
        tags["dance"].id,
        tags["art"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2379@13-03-2025_19-01-44.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The largest hackathon in Russia: 5-7 June",
      description:
        "📣One of the largest Russian online hackathons: .\n\n📌5-7 June; 19-21 June\n⏱Hackathon duration: 36 hours\n‼️Over ten tracks and topics from top companies and governing bodies.\n💵Prize fund: 5 000 000 rubles\n\n👉More info: \n🔥Application deadline: 2 June",
      tagIds: [tags["hackathon"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_488@07-10-2021_17-45-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "дентиикатор конер",
      description:
        "🤗 Dear friends! \n\n📖 😉 You will learn: \n- How to stop being the victim/aggressor- How to cope with hard feelings \n- Which techniques of emergency psychological assistance you can use right at the moment \n🔥🔥🔥\n\n* The language of the meeting is Russian\n\n💥 tomorrow - May, 21, (Thursday)\n⏰ 17.00 - 19.00\n✅ zoom:\n\n\n\nИдентификатор конференции: 816 2454 7467\nПароль: 076988",
      tagIds: [tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1239@04-07-2023_17-30-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_560@02-12-2021_14-36-52.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2536@27-05-2025_10-35-33.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "James Dyson Award",
      description:
        "\n\nJames Dyson is on the hunt for bright minds with fresh ideas from around the globe. If you have an invention that solves a problem and can change lives, the James Dyson Award rewards those who have the persistence and tenacity to develop their ideas.\n\n🔹Significant cash prize (from £2,000)\n🔹Make a name for yourself as an inventor\n🔹Develop tangible technologies \n🔹Generate media exposure to kick-start your career\n\n👉More info .\n🔥Application deadline: 16 July, by 10 am.",
      tagIds: [tags["contest"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Hackathon Competition — FinTech Hackathon",
      description:
        "📣Competition fields: FinTech, Cybersecurity, Digital Health, Super-services, Intellectual Transport Systems, Digital Education.\n\n‼️Teams from 2-5 people, age 18+\n\n🔹Each hackathon has its own prize fund.\n🔹Opportunity to launch a pilot project with real customer.\n🔹Prototype elaboration with industry experts.\n🔹Chance to get a job offer from hackathon participants\n\n👉more info: ",
      tagIds: [tags["hackathon"].id, tags["startups"].id, tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2404@21-03-2025_11-06-08.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1187@17-05-2023_19-30-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Media contest to address the importance of inclusion, peace...",
      description:
        "📣 media contest to address the importance of inclusion, peace and friendship among all people!\n\nThree available formats with 12 total nominations:\n- Text format\n- Video format\n- Photo format\n\nThe contest also offers series of workshops and master-classes.\n\n📌First stage contest: 1 June - 1 Sept\n👉More info and apply: ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_918@01-12-2022_11-30-40.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2577@18-06-2025_12-14-58.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Python & Git - fluent Russian 20-21 June -",
      description:
        "📣- familiarity with Python, Git\n- fluent Russian\n\n📌19 June - training day 09:00-15:00\n📌20-21 June - work shifts 09:00-15:00\n\nYou will get branded T-shirts + 3 times-a-day meals.\n\n👉For more info and apply: ",
      tagIds: [tags["internship"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Data Science and Artificial Intelligence Project: 147 real...",
      description:
        "📣\n📌4-5 July\n\n🔹Teams from 2 people\n🔹48 hours, work where you want\n🔹147 real cases from 5 countries which are aimed at solving global socio-economic issues through application of data science and artificial intelligence.\n\n👉Project news: \n👉More info & apply: \n‼️\n\n✅",
      tagIds: [tags["hackathon"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "- Rosneft Proppant Check Challenge, online from",
      description:
        "📣- Machine Learning hackathon, 24-25 September. Task: creating optimal path on hard surface. Prize fund: 289000 rubles.\n\n- Programming/robotics hackathon, 16-17 October. Task: creating a solution in manufacturing process using robot-manipulator. Prize fund: 139000 rubles\n\n- Rosneft Proppant Check Challenge, online from September to November. Task: determining distribution of linear dimensions of profanate grains using series of photos. Prize fund: 142000 rubles\n\n🇷🇺Events are in Russian.\n📌Registration open by 1st of Sept.\n👉More info & register: ",
      tagIds: [
        tags["hackathon"].id,
        tags["machine-learning"].id,
        tags["robotics"].id,
        tags["startups"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2045@30-09-2024_16-41-38.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1277@01-08-2023_12-00-35.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1917@18-07-2024_12-00-55.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1345@21-09-2023_13-30-57.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "IU Ultimate Frisbee Game!",
      description:
        "📣Want to try something new? Join our first Ultimate Frisbee game!\n\nWhen: Tomorrow, 18:00\nWhere: meeting by IU main entrance\nWhat to wear: comfortable sportswear\nRules of the game: ",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2539@28-05-2025_10-59-39.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1876@01-07-2024_13-55-00.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_728@06-05-2022_11-02-39.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: 'Rosatom contest "Atom Ryadom" - make ',
      description:
        '📣Rosatom contest "Atom Ryadom" - make a video and complete application form to take part.\n\n- Video topic: Friendly Atom\n- Application deadline: 3 August\n- Video duration: maximum 20 mins, 600mb\n- Winning prize: Apple iPad 128Gb\n- Video requirements: format is free, but portrait shooting is compulsory.\n\n👉More info & application form: ',
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1107@29-03-2023_13-06-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2101@23-10-2024_15-43-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_708@12-04-2022_16-00-28.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1185@16-05-2023_14-40-40.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Ak Bars Bank, InnoSTage and Kaspersky Innovation",
      description:
        "📣 from Ak Bars Bank, InnoSTage and Kaspersky Innovation Hub.\n\nOne week challenge, two tracks:\n🔹Fintech – create new services for the bank\n🔹Cybersecurity – automate daily operations of cyber security expert\n\n💰Prize fund – 700 000 rubles\n📌1 to 8 August\n\nBest teams will get support from the organizers to develop their projects, as well as will possibly obtain job offers from them.\n\nParticipation requirements:\n- Teams from 2 to 5 people\n- Age 18+\n\n👉More info and apply .",
      tagIds: [
        tags["contest"].id,
        tags["hackathon"].id,
        tags["cybersecurity"].id,
        tags["conference"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_994@03-02-2023_19-01-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1149@18-04-2023_12-01-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1463@23-11-2023_17-25-06.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1303@30-08-2023_17-00-55.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: ", 24-28 August Two grant contests:",
      description:
        "📣, 24-28 August\n\nTwo grant contests:\n\n- Federal Agency for Youth Affairs projects\n- Foundation for Civil Institutions Development Fund projects\n\n💰Grants are worth up to 1,500,000 rubles\n📌Application deadline: 20 July\n👉More info & apply .",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1930@26-07-2024_14-01-36.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1136@12-04-2023_10-28-53.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2548@02-06-2025_16-28-46.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "    ",
      description:
        "📣 - initiative to involve talented youth in project work in Russian science, as well as develop regions from technological perspective.\n\n📌Application deadline: 1 August\n👉More info: ",
      tagIds: [tags["science"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1020@14-02-2023_12-20-11.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2343@28-02-2025_12-26-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Huawei launches the contest for students in AI algorithm...",
      description:
        "📣Huawei launches the contest for students in AI algorithm creation  in the following areas:\n \n- Advertisement CTR Prediction\n- Search Ranking Prediction\n- Digital Device Image Retrieval\n\n📌Application deadline: 20 Sept.\n\n👉More info & .",
      tagIds: [
        tags["artificial-intelligence"].id,
        tags["contest"].id,
        tags["machine-learning"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2466@14-04-2025_18-32-00.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2502@06-05-2025_15-05-15.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: 'Media Contest "We are the World" - photovideographictext...',
      description:
        '📣Media Contest "We are the World" - photo/video/graphic/text contest for creative people in 12 nominations related to formation of positive intercultural environment in Tatarstan.\n\n👤14-30 y/o people who currently reside in Tatarstan.\n\n🔥Also, the contest offers various online master-classes in photography, video-making and literature.\n\n📌Application deadline: 1 September.\n👉More info & apply .',
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2520@16-05-2025_16-33-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "OnlineOffline formats Sudak city Form professional art...",
      description:
        '📣. \n‼️Online/Offline formats\n👇Sudak city\n\nForm professional art communities, give life to your artistic ideas and find mechanisms for governmental and social support.\n\nFestival\'s program will include flash mobs, art performances, fashion designer shows, costume night processions, theatrical and circus performances, film screenings, contemporary art exhibitions, stand-up performances, creative competencies open championship "ArtMasters", and more.\n\n👉More info & apply: \n📌Application deadline: 20 August',
      tagIds: [tags["programming"].id, tags["festival"].id, tags["art"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "City Council is arranging a concert on the , where our...",
      description:
        "📣We have many talents in our city, and it\'s time to gather in one place and one time. City Council is arranging a concert on the , where our residents will be the main stars!\n\nIf you sing / play in a music group, dance, perform with a stand-up, read poetry or know how to do something unusual, then apply . The jury will select the most interesting performers and will run the show on August 30 in the park near the Residential Complex.\n\n📌Application deadline: August 26\n👉Q&A: ",
      tagIds: [
        tags["contest"].id,
        tags["concert"].id,
        tags["dance"].id,
        tags["music"].id,
        tags["programming"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "IU Reading Club",
      description:
        "📣IU Reading Club invites students and staff members to surf through amazing books together.\n\n‼️✅Club\'s format implies formation of groups with 5 people, where chosen books will be discussed on a weekly basis. Book variation will change every month.\n\n👉Jump into this  if you are interested in joining our reading community!",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_734@12-05-2022_18-01-38.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1733@12-04-2024_18-15-05.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Golf Club at Sviyaga Hills needs caddies for regular shift",
      description:
        "📣Local golf club at Sviyaga Hills needs caddies for regular shifts on Fridays, Saturdays and Sundays.\n\n✅Payment 1.5k per day (4-5 hours of work). A buffet will be provided. If anyone is interested, please message ",
      tagIds: [tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_563@06-12-2021_18-28-41.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1924@23-07-2024_17-25-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1343@20-09-2023_18-30-27.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1319@06-09-2023_18-00-41.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Master of Sports in Sambo and Candidate Master of Sports in...",
      description:
        "📣✅If you ever wanted to learn the most effective techniques of martial arts or improve your combat abilities, this is your chance! Both girls and boys are welcome!\n\n - Master of Sports in Sambo and Candidate Master of Sports in Judo\n\nTue 19:00 - 21:00 (wrestling)\nThu 19:00 - 21:00 (wrestling)\nFri 19:00 - 21:00 (wrestling + punches)\nSat 9:30 - 11:30 (working with rubber)\n\n👉Join the 👉Club Heads: \n👉For sambo sport hours you can enroll here: \n\n✅Browse more clubs on ",
      tagIds: [tags["master-class"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1927@25-07-2024_14-16-58.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_456@17-09-2021_11-50-56.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_691@05-04-2022_12-01-12.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Radioelectronic combat - Radionavigation -",
      description:
        "📣📌7-9 October, Moscow\n\nThe purpose of the competition is to create all-Russian platform that unites radio amateurs-enthusiasts into professional teams and identify the best innovative scientific and technical ideas and solutions in the field of radio communications.\n\n✅Three contest directions:\n- Radioelectronic combat\n- Radionavigation\n- Radio monitoring\n\n📌Application deadline: 4 October\n👉More info & apply: ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_896@16-11-2022_15-08-44.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1361@04-10-2023_09-00-20.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Robotics Lab Tour - August 31, 5.00 pm",
      description:
        "🤖\n\n- Education (bachelor robotics track, robotics masters)\n- Research (self-driving cars, manipulators, drones, tensegrity, neuroscience, humanoid robots)\n- Competitions and olympiads\n\n‼️\n\n- Presentation by Alexandr Klimchik, Professor, Head of the Robotics Center\n- Presentation by Pre-university Center\n- Robotics Lab Tour\n\n📌When – August 31, 5.00 pm\n📌Where - room 107\n👉Register ",
      tagIds: [tags["robotics"].id, tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_725@29-04-2022_17-59-20.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1226@23-06-2023_20-30-42.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2570@15-06-2025_16-53-17.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "ArtSpace Workshop Programs at the today!",
      description:
        '📣  \nWe are honored to present you \' program at the  today!\n\n📚 - Workshop Programs in ArtSpace\n- Brief explanation about ""\n\n📍 Location: ArtSpace Building\n⏳ Time: 👉For more  join the channel ',
      tagIds: [tags["programming"].id, tags["workshop"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_570@11-12-2021_20-25-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The first fixture day of organized by !",
      description:
        "📣Today we are having the first fixture day of  organized by We have 5 teams, which will clash head to head for a couple of weeks every Tuesday, Thursday and Saturday. Among them are two student teams:  and !\n\n📌18:30-20:30, Football Field\n✌️Join our football event and support your mates!",
      tagIds: [
        tags["sports"].id,
        tags["programming"].id,
        tags["game"].id,
        tags["conference"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2258@27-01-2025_16-02-31.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_625@11-02-2022_14-46-33.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2018@13-09-2024_16-01-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Anime Club resumes their language branch by launching...",
      description:
        "📣Anime Club resumes their language branch by launching another Japanese course for beginners AGAIN! The first meeting will consist of the language overview and requires NO background knowledge, so everyone is welcome!!\n\n📌Wednesday, Sep 2, 19:30-21:00\n📍Room 303\n\n👉Contacts:  or . Join .\n_ _ _\n\n🔹\n\n🔹- Theatre Community\n- Ahuratus Club\n- B2B Spinners: Tetris Club\n- InnoStonks: Investors Club of Innopolis\n\n🔹- Art Club\n- Media Club\n\n👉Message  if you want to take over any of those.",
      tagIds: [
        tags["language-learning"].id,
        tags["seminar"].id,
        tags["club-meeting"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_637@22-02-2022_13-53-26.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1304@30-08-2023_18-01-10.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "5518 Studios      ",
      description:
        '📣 \n\nYou will find out more about gaming industry, the psychology of the gaming business and how to get there, how to make a career in game development, how to work in the international market and, of course, about 5518 Studios, its history, philosophy, successes and failures.\n\n📌September 11, Friday - at 16:00\n📍Technopark, 2nd floor, "Wood" zone, lecture hall (former press center)\n👉Register .\n\nMaxim Mikheenko is the executive director of the game development studio. They took part in the creation of Call of Duty: Black Ops IIII, Borderlands 3 DLC, Fortnite, SimCity Mobile, Walking Dead: TWC, Star Trek - games known all over the world.\n\n!\n\n👉Link to the .\n👉Link to his  with вДудь.\n🇷🇺Event\'s language: Russian',
      tagIds: [
        tags["seminar"].id,
        tags["conference"].id,
        tags["lecture"].id,
        tags["job-fair"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "How to read one book in a day?",
      description:
        "📣\n\nPeople who like reading want to read more. People who don\'t like reading want to finish it as soon as possible.\n\nWe are going to hold the series of sessions to increase the amount of reading materials you can digest. We will start from some basic everyday laws that need to be applied to help you read one book in a day.\n\n✅\n\n🔹Basics of Speed reading\n🔹Basics of Comprehension\n🔹Remembering\n🔹Comprehension and Focus\n🔹Strategies of Comprehension\n\n👉Join the  if you are interested!",
      tagIds: [tags["workshop"].id, tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1315@01-09-2023_15-56-39.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_460@20-09-2021_19-30-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1858@21-06-2024_09-24-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The Department of Pre-University Education is opening an for...",
      description:
        "📢Department of pre-university education is opening an  for students!\n\nThrough this track we\'ll form a team to compete in Russian and International student math contests.\n\n🔹Community of students and professors who love math.\n🔹Challenging tasks and internal contests that will boost your skills.\n🔹 Participation in Russian and International student math olympiads and contests.\n\n📌Join Induction meeting on 7 Sept, at 17:00, in room 314.\n\n👉Register for the meeting ",
      tagIds: [tags["mathematics"].id, tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1954@22-08-2024_17-56-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Skateboarding, Bmx, Roller ice skating, scooters",
      description:
        "📣  🛹\n\nWe are pleased to present you a sports club for 🛹 skateboarding, 🚲 bmx, ⛸ roller & ice skating, 🛴 scooters and 🏂 snowboarding.\n\nIf you\'ve ever wanted to do these extreme sports in a good company, this is your chance! Both girls and boys are welcome!\n\n🔹we have an  team and we are glad to see 🔹skating hours are marked by the head of the club as 🔹we can teach you to ride anything !!\n\n👉Contacts:  \n👉Join ",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2506@08-05-2025_11-04-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Digital week-2020 forum - Analysers, data scientists and",
      description:
        "📣Digital week-2020 forum - Analysts, data scientists and python developers are invited to participate in Digital Health and Super-Services hackathon!\n\nDIGITAL SUPERHERO is an all-Russian series of online hackathons on various topics, which are held with the support of the Government of the Republic of Tatarstan. The main goal is to create favorable conditions for the development of ideas in the field of digital technologies in various sectors of economy. \n\n📌12-19 Sept, final stage 19-21 Sept \n👉More info & apply: \n👤Registration issues: ",
      tagIds: [tags["hackathon"].id, tags["forum"].id, tags["data-science"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_968@30-12-2022_18-01-00.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_937@13-12-2022_14-01-54.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1730@11-04-2024_16-20-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: '"Start" program is aimed at creating new and supporting...',
      description:
        '📣\n\nThe "Start" program is aimed at creating new and supporting existing small innovative enterprises seeking to develop new product, technology or service using the results of their own scientific, technical and technological research.\n\n✅Competition participants will be able to take part in the educational intensive "", which will start recruiting from 10 September.\n\n🔺16 different tracks\n💰Up to 3 000 000 rubles grant\n👉More info & apply 📌Application deadline 5 October',
      tagIds: [tags["startups"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_578@24-12-2021_12-03-50.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Participation in the ICPC Championship",
      description:
        "📣📌To take part in the championship, you should  your team of 3 students. \n\n👤If you want to participate, but do not have a team, then we will help you find it.\n\n💯You will receive intensive training to be prepared for the upcoming contest, which will begin next week.\n\n😱Participants will receive pleasant bonuses for active participation in trainings and in the ICPC championship.\n\n👉Join our 👉For questions: ",
      tagIds: [tags["workshop"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1483@12-12-2023_09-15-00.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_684@30-03-2022_13-14-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Playing in the theatre community!",
      description:
        "📣Ever wanted to play in theatre?\n👉 our theatre community!\n🔥We are working with a hired director to produce a performance by the end of the semester!\n\n🇷🇺So far it\'s only in Russian sorry...",
      tagIds: [tags["language-learning"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1213@13-06-2023_11-30-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Malsi Music - The Freaks - Bubble Gum",
      description:
        "📣When was the last time you couldn\'t walk cuz of too much dancing? Long ago? Well its time to fix this😉 \n\nWe are having a big party for the Programmer\'s Day🔥 It\'s , so you can\'t miss it!\n\n- Malsi Music\n- The Freaks\n- Denis Enfant\n- Bubble Gum\n\n📌When: September 12\n⏱20:00-01:00\n‼️Only 18+",
      tagIds: [tags["party"].id, tags["dance"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2123@30-10-2024_11-07-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2038@24-09-2024_09-20-29.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "21 November (Saturday) Art Space centre",
      description:
        "📣 - art event where you can show your talent to the whole city!\n\n✅You will be split into two teams () and will take part in artistic !\n\n🔥This event will be , so we\'ll try to make it real !\n\n🕺You\'ll have rehearsals with a director to fit you in the program of your team.\n\n👉Fill the  to take part!\n\n📌21 November (Saturday)\n📍Art Space centre",
      tagIds: [tags["art"].id, tags["internship"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_534@19-11-2021_16-42-14.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "We are looking for students who want to join .",
      description:
        "📣We are looking for students who want to join . If you have always dreamed of becoming a , ! \n\nThe basics will be delivered during our , so no skills are required — only your motivation. You can discuss your projects, get feedback and improve your skills, make new friends and get published in our new monthly newspaper.\n\n👉.",
      tagIds: [
        tags["workshop"].id,
        tags["seminar"].id,
        tags["conference"].id,
        tags["lecture"].id,
        tags["club-meeting"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1794@27-05-2024_15-01-48.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1251@13-07-2023_12-00-05.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Lecture by Esther Duflo",
      description:
        "📣 lecture by Esther Duflo, professor at the Massachusetts University of Technology (MIT) and winner of the 2019 Alfred Nobel Memorial Economics Prize for an Experimental Approach to Fighting Global Poverty.\n\n⁉️Among the main problems of today\'s global economy are inequality, social insecurity, ecology, migration, and slowing economic growth. But in public debate, these issues are often seen quite differently than scientists. What myths exist today regarding economic policy? And what solutions to pressing economic problems do modern researchers have?\n\n👤About the lecturer: Esther Duflo is one of the leading experts in poverty and development economics. Her research interests include inequality, migration, social insecurity caused by economic, cultural, political and environmental factors. \n\n📌When: 16 sept 17:00\n✅Format: online.\n👉Register .",
      tagIds: [
        tags["lecture"].id,
        tags["talk"].id,
        tags["seminar"].id,
        tags["conference"].id,
        tags["workshop"].id,
        tags["master-class"].id,
        tags["forum"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "ICPC Qualification Stage, 11-25 Sept, approx. 10 hours",
      description:
        "📣  ICPC Qualification Stage, 11-25 Sept, approx. 10 hours\n\n👤 Job decription: event promotion among IU students, coordination and assistance in team organization for the ICPC.\n\n👉 Apply & more volunteering opportunities .",
      tagIds: [tags["volunteering"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "21 November (Saturday) Art Space centre",
      description:
        "📣 - art event where you can show your talent to the whole city!\n\n✅You will be split into two teams () and will take part in artistic !\n\n🔥This event will be , so we\'ll try to make it real !\n\n🕺You\'ll have rehearsals with a director to fit you in the program of your team.\n\n👉Fill the  to take part!\n\n📌21 November (Saturday)\n📍Art Space centre",
      tagIds: [tags["art"].id, tags["internship"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1780@17-05-2024_09-32-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Hackathon: from 18 to 23 Sept.",
      description:
        '📣✅Track "Virtual and Augmented Reality"\n✅Track "Development of recognition algorithms"\n✅Track "Creation of services for government agencies"\n⠀\n📌Hackathon dates: from 18 to 23 Sept.\n📌 Registration deadline: 15 Sept.\n⠀\n💰⠀\nApply & more info: ',
      tagIds: [
        tags["hackathon"].id,
        tags["computer-science"].id,
        tags["programming"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_661@15-03-2022_15-03-59.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1476@06-12-2023_11-32-50.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2356@05-03-2025_16-31-09.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_865@25-10-2022_19-35-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Fintech Ecosystems Smart Transport Systems Situational...",
      description:
        "📣Opportunity to attend  - the largest international digital forum in the region.\n\n🔹🔹Over  speakers\n🔹 format\n\n🔺Fintech Ecosystems\n🔺Smart Transport Systems\n🔺Situational Centres\n🔺New Era Cybersecurity\n🔺Innovative Business Integrations\n\n👉Event\'s info: 👉Event\'s program: 📌21-24 Sept\n\n‼️",
      tagIds: [
        tags["forum"].id,
        tags["conference"].id,
        tags["cybersecurity"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1722@04-04-2024_12-30-51.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1912@16-07-2024_14-01-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2216@08-12-2024_19-05-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Invites IU students to participate in Dec 7-9, 2020",
      description:
        "📣invites IU students to take part in 📌Dec 7-9, 2020\n📌Applications open: Oct 31-Nov 20, 2020\n.",
      tagIds: [tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_768@17-06-2022_10-55-31.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Telegram Event : 23-27 Sept.",
      description:
        "📣\n\n🔹\n- bachelor students;\n- developers, designers, marketers, analysts, data scientists\n🔹\n- Technologies for bilingual education development\n- Tatar language and IT\n- Technologies for business and science\n🔹\n\n📌  26-27 Sept.\n📌 : 24 Sept.\n\n👉Register 👉Join Telegram 🇷🇺 Event language is Russian (knowing Tatar language is NOT required). Foreign students can participate with Russian-speaking teammates.",
      tagIds: [tags["conference"].id, tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1354@28-09-2023_19-21-37.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Do you wanna be part of a club that combines bizarre...",
      description:
        "📣Do you wanna be part of a club that combines bizarre activities, martial arts, and tea parties with cookies? Then you need to try  today!\n\n📌20:30 in Sport Complex, room 232.\n\n is waiting for boys and girls to join! Today we have a game training!",
      tagIds: [tags["game"].id, tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_571@17-12-2021_11-18-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_628@14-02-2022_13-01-35.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Digital week-2020 forum - Track: AVVR DIGITAL",
      description:
        "📣Digital week-2020 forum - ✅Track: AV/VR\n\nDIGITAL SUPERHERO is an all-Russian series of online hackathons on various topics, which main goal is to create favorable conditions for the development of ideas in the field of digital technologies in various sectors of economy. \n\n📌18-23 Sept (starting tomorrow!)\n👤Teams 2-5 people\n👉More info 👉To apply message \n‼️",
      tagIds: [tags["hackathon"].id, tags["forum"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Students VS citizens\' team !",
      description:
        "🔥\n\nStarting with the game for the 3rd place between  and , and finishing the competition with the final game:  of students VS citizens\' team !\n\n‼️📌Where: Football field\n🔹18:30 - \n🔹19:30 - ",
      tagIds: [tags["sports"].id, tags["contest"].id, tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1230@27-06-2023_19-01-32.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1340@19-09-2023_09-47-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Sport Complex, Big Hall Come, support and enjoy!",
      description:
        "📣📌When: Today, 20:00\n📌Where: Sport Complex, Big Hall\n\n🙏Come, support and enjoy the game!",
      tagIds: [tags["sports"].id, tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2377@13-03-2025_15-02-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1695@21-03-2024_12-30-14.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1606@21-02-2024_16-24-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2559@09-06-2025_15-02-29.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University Application deadline: 1 October 2020",
      description:
        "📣Two-weeks course program will highlight powerful combination of Robotics and ML with particular emphasis on reinforcement learning and deep learning. The program is delivered by international experts and research staff from British, Italian and German institutions.\n\n🔹- 3-4 years Undergraduate students\n- Graduate and postgraduate students\n\n📍When: 7 – 20 December \n📍Where: Innopolis University  \n📍Application deadline: 1 October 2020\n\n👉School program, speakers and application form are available .\n\n👉For any enquiries contact ",
      tagIds: [
        tags["artificial-intelligence"].id,
        tags["machine-learning"].id,
        tags["computer-science"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1597@16-02-2024_09-19-51.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_591@18-01-2022_16-30-18.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1396@24-10-2023_11-43-16.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_508@22-10-2021_10-52-07.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Hackathon Info: . VK . VK . V",
      description:
        "📣\n\n🔺Participants: bachelor students\n🔺Teams: 2-4 people\n\n🔹\n- Living books\n- Book recommendations\n- Development books\n- Programming language\n\n🔹\n- Tatar search tool\n- Visual translator\n- Tatar keyboard\n- Intellectual task-manager\n\n👉Hackathon info: .\n👉VK .\n",
      tagIds: [tags["hackathon"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2560@10-06-2025_09-05-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1086@22-03-2023_15-30-50.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_830@28-09-2022_14-12-42.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Toastmasters - first meeting of the season!",
      description:
        "📣  - first meeting of the season!\n\n😎 If you want to develop your  and meet  people, you should surely come!\n\n📣 You can come as a guest and participate in  or prepare a speech in advance (please do it in advance with event hosts)\n\n📌 See available roles for today .\n👤 See all Toastmasters roles  \n👉 Join our group: \n\n⏰ : September 24th, 7pm\n🚪 : 105 room",
      tagIds: [tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1765@03-05-2024_17-50-22.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Join the group: The community of like-minded people aiming...",
      description:
        "✅🔹Looking for designers, content writers, photographers and videographers. \nContact: \nMedia Club 🔹The club intends to extend the abilities of minds and learning how to use instincts. \nJoin the group: 🔹Main disciplines: CS:GO and Dota2. Looking for trainers in other disciplines.\nJoin the group: 🔹The community of like-minded people aiming to implement various digital projects to make a difference around us.\nJoin the group: 🔹The club wishes to create a public Minecraft server for players from all over the world to spread information about IU and create a game community.\nJoin the group: 👉Explore all 52 clubs on ",
      tagIds: [tags["job-fair"].id, tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1092@23-03-2023_18-01-25.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2436@04-04-2025_10-02-53.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University December 17-18, Innopolis University",
      description:
        "📣 📌December 17-18, Innopolis University\n\n• Software engineering and software development management;\n• Telecommunication systems and computer networks;\n• Mathematical modeling, numerical methods and program complexes;\n• System analysis, information processing;\n• Automated control systems.\n\n‼️The Program Committee will accept articles for the Conference . \n\n\n\n💸Free for IU students\n👉More info at \n👉Contact: ",
      tagIds: [
        tags["computer-science"].id,
        tags["conference"].id,
        tags["workshop"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2279@10-02-2025_11-31-40.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Moscow Institute of Physics and Technology is conducting...",
      description:
        "📣Moscow Institute of Physics and Technology is conducting online high intense courses (lectures, contests, task reviews) and algorithmic programming championship.\n\n✅Russian citizens or for those who have Russian translation of their passports\n\n✅1) Sign up to this event\'s web-site  and fill application form for the championship\n2) Fill in the form for the certification via this  (after registration)\n3) Join telegram group via this 4) Solve at least one problem in each block of the contest\n5) Take part in the team championship\n\n✅- Experience\n🔥Free of charge\n🔥No admission selections\n\n👉Questions:  or ‼️🔔for registration: Today, 11 pm\n‼️🔔for solving contest problems: Friday, October 2nd",
      tagIds: [
        tags["programming"].id,
        tags["contest"].id,
        tags["lecture"].id,
        tags["physics"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2039@24-09-2024_11-45-27.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2161@14-11-2024_16-24-52.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1172@04-05-2023_17-31-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Sberbank Internship (3-6 months)",
      description:
        "📣Sberbank internship (3-6 months)\n🇷🇺 Required language: Russian.\n \nYou can apply for a QA Engineer assignment at the Sberseasons program in Innopolis. You will:\n\n- work with databases\n- analyze existing solutions for database migration\n- help with migration service design\n- create automatic tests \n\n🔹Who can apply: 3-4 year bachelor students, master students and graduates.\n📍Where: Innopolis University / online \n📍Application deadline: 30 October 2020 \n👉Wages: 25,000 to 50,000 rubles  \n\n✅Internship info 👉Any questions - contact ",
      tagIds: [tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_782@13-07-2022_12-16-26.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1661@06-03-2024_09-16-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1432@10-11-2023_12-30-57.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Moscow Institute of Physics and Technology is conducting...",
      description:
        "📣\nMoscow Institute of Physics and Technology is conducting online high intense courses (lectures, contests, task reviews) and algorithmic programming championship.\n\n✅1) Sign up to this event\'s web-site  and fill application form for the championship\n2) Fill in the form for the certification via this  (after registration)\n3) Join telegram group via this 4) Solve at least one problem in each block of the contest\n5) Take part in the team championship\n\n✅- Experience\n👉Questions:  or ",
      tagIds: [
        tags["programming"].id,
        tags["computer-science"].id,
        tags["lecture"].id,
        tags["artificial-intelligence"].id,
        tags["contest"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2114@27-10-2024_12-01-30.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "All-Russian Online Festival of University Technological...",
      description:
        "📣The All-Russian Online Festival of University Technological Projects \n\nTake a chance to receive support from experienced and successful businessmen and corporations, acquire new knowledge, attract attention of potential investors and win a cash prize for developing your business.\n\n👇- You have innovative solution\n- You have product\'s prototype\n- You have at least one student/teacher from your university in your team.\n\n📌Event\'s date: 12 November\n📌Application deadline: 25 October\n👉More info & apply .",
      tagIds: [
        tags["business"].id,
        tags["startups"].id,
        tags["contest"].id,
        tags["festival"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1827@07-06-2024_22-30-41.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1241@06-07-2023_12-30-21.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1307@31-08-2023_10-04-54.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "SAP S 4HANA Academy Program",
      description:
        "📣SAP S / 4HANA Academy program calls for ambitious students who will have the opportunity to upgrade their skills without leaving their homes.\n\n✅ \n\nBuild intelligent enterprise business processes based on SAP S / 4HANA, work in a combat system, attend live master classes with SAP applications, and attract attention of future employers.\n\n✅- Online program for 3-4 year undergraduate or graduate students\n- You will receive a state-recognized certificate of advanced training.\n\n📌Application deadline: 5 October\n👉More info & apply ",
      tagIds: [tags["business"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1727@09-04-2024_11-02-40.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1381@11-10-2023_19-15-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_996@04-02-2023_15-15-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2549@02-06-2025_17-53-50.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Math - IU Integration Bee",
      description:
        "📣Have you heard about ?\n\nOur University is going to join this tradition and start a new IU competition in Math - IU Integration Bee.\n\nThe goal is to solve integrals faster than your opponents. Winners will have prizes. Furthermore, 📌Everyone who wants to try are welcome to the first Integration Bee on 12 of October at 6 p.m.\n\n👉Join the  if you want to take part.",
      tagIds: [tags["mathematics"].id, tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_642@26-02-2022_11-00-00.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "How to turn dull townships into utopian garden cities",
      description:
        "📣 Someone who is tired of living in dull townships among gray concrete boxes and knows how to turn them into utopian garden cities.\n\n🔹Students, 1 or 2 people per idea.\n🔹From 18 y/o, Fluent English\n🔹Best ideas will be connected with expert mentors and other resources for implementation.\n\n✅Topics are limited only by your imagination, but you can start from this: Education, Clean Water, Sources of Energy, Career, Body and Mind, Accessible Environment, Smart Cities, Climate Change.\n\n📌Application deadline 25 Oct\n👉To apply record 1-minute video and upload it .",
      tagIds: [tags["language-learning"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Virtual Reality in Volga, Volga Region",
      description:
        "📣Participants will be assigned to mixed teams of specialists from other universities, which will be given a task that must be implemented in augmented or virtual reality format. The topics are related to Volga region culture.\n\n📌15-17 October, offline format\n👉If interested please message .",
      tagIds: [tags["hackathon"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1824@07-06-2024_14-20-17.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_641@25-02-2022_12-40-52.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1911@16-07-2024_12-00-54.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: ' енет  " е',
      description:
        '📣"УМНИК Технет НТИ" - the contest aiming to support young scientists who wish to fulfil themselves through innovation and technology.\n\n✅- digital technologies;\n- new materials and chemical technologies\n- new devices and intelligent production technologies\n\n📌Application deadline: 1 Nov\n💻Online semi-final: 02 Nov - 22 Nov\n🚄Offline final: 09 - 11 Dec, St. Petersburg\n\nContest semi-final will assess scientific-technological level of the project. The final will focus on feasibility and commercialization. 👉More info and apply ',
      tagIds: [tags["contest"].id, tags["science"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_961@28-12-2022_17-01-14.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1840@14-06-2024_09-11-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "MoNeTec-2020 International Conference and Exhibition",
      description:
        "📣«Modern Network Technologies, MoNeTec- 2020» International Conference and Exhibition.\n\n🔹online format\n🔹9 topics\n🔹12 expert speakers from Russia, USA, France, China, Sri Lanka and Nepal.\n\n📌27-29 October\n\n👉Conference 👉Apply to be a listener ",
      tagIds: [tags["conference"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "IU Typing master contest Language: English",
      description:
        "📣IU Typing master contest\n\nLanguage: English\nWhen: Sunday, 14:00\nWhere: Reading Hall, floor 1\n\n‼️👉Apply ",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1250@13-07-2023_10-00-20.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_855@18-10-2022_17-02-29.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1685@16-03-2024_11-05-18.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Math - IU Integration Bee",
      description:
        "📣Have you heard about ?\n\nOur University is going to join this tradition and start a new IU competition in Math - IU Integration Bee.\n\nThe goal is to solve integrals faster than your opponents. Winners will have prizes. Furthermore, 📌Everyone who wants to try are welcome to the first Integration Bee on 12 of October at 6pm in Room 105.\n\n👉Join the  if you want to take part.\n✅Register for the contest ",
      tagIds: [tags["mathematics"].id, tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1144@16-04-2023_20-09-19.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Red Bull Global Workshop for Student Innovators",
      description:
        "📣Do you have an idea that might change student life at the campus or even will change the whole world?\n\nRed Bull gives wings to student innovators to drive positive change through tech solutions. Best ideas will be invited to the Global Workshop.\n\nTo apply you need to produce a 1-minute video about your project in English or with English subtitles. You can watch the video from last year\'s winners . More info .\n\n‼️👉If you are interested in attending this workshop please let  know .",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_781@11-07-2022_18-01-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2034@20-09-2024_17-08-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2180@21-11-2024_13-44-23.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Hobby Games — Citadels",
      description:
        "📣 🎲 \n\n‼️Quick game tutorial will happen today at 7pm. Inbox  if you are interested.\n\n For all those who wish to play something else Hobby Games arranges Citadels and other little out-of-tournament games. Our club guarantees a fascinating time and tasty goodies😋☕️🧁\n\n📌👉Sign up  \n🙏See you!",
      tagIds: [tags["club-meeting"].id, tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_544@25-11-2021_12-19-41.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_582@10-01-2022_10-12-14.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2057@07-10-2024_12-59-54.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_869@27-10-2022_15-28-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Sport Complex, room 233",
      description:
        "📣\n\nIf you ever wanted to start dancing , but classes seemed too advanced - here\'s the great opportunity to join the club, have fun at the classes and get sport hours for that!\n\n📌When? Tuesday 18:15 - 19:45\n🏃Where? Sport Complex, room 233\n👉Our ",
      tagIds: [tags["dance"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1852@19-06-2024_17-47-56.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1008@10-02-2023_12-16-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_780@06-07-2022_12-07-46.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University will host a round table meeting with...",
      description:
        "📣Innopolis University will host a round table meeting with the  from Brazil, Russia, India, China and Russia.\n\nThe meeting will involve a presentation by Ministry of Foreign Affairs of Russia on visa regime, youth diplomats council affairs and BRICS recent activity and partnership. \n\n🗣\n\n📌This Friday, 10am-12pm.\n\n‼️The number of places is limited.\n👉.",
      tagIds: [tags["seminar"].id, tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1599@16-02-2024_13-22-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1704@27-03-2024_17-19-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2235@17-12-2024_13-01-59.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Online International Conference on Artificial Intelligence...",
      description:
        "📣Online International Conference on Artificial Intelligence and Data Analysis \n\n3 days of exciting presentations by recognized world experts in development and implementation of AI technologies in various areas of business and life.\n\n🔹20 topics\n🔹200+ speakers\n🔥Participation is FREE\n📌20-22 November\n\n👉Event\'s program & registration ",
      tagIds: [
        tags["conference"].id,
        tags["artificial-intelligence"].id,
        tags["business"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Break Dance club now has more!",
      description:
        "🕺🕺💃💃\n\nBreak Dance club now has more to offer! Yes, just like the video game this club is all about Dance. \n\n\n\n👇\n\n-Break Dance\n-Popping\n-Shuffle\n-HipHop etc.\n\n📌Monday, Wednesday 18:00-20:00\n📌Sports Complex, Room 233\n\n👉, so just  and enjoy!",
      tagIds: [tags["dance"].id, tags["programming"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Student Union are looking for amazing VOLUNTEERS to host...",
      description:
        '📣Student Union are looking for amazing  VOLUNTEERS to host another incredible night at HALLOWEEN on 31 October!\n\n👉Browse available roles . \n\n🤡Event organizers are also looking for, apply for "Station worker" if interested.',
      tagIds: [tags["volunteering"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Olympiad 2020 — Educational Olympiad",
      description:
        "📣 is a large-scale educational Olympiad. The tasks are drawn up by experts from leading Russian universities and the largest companies in the country.\n\nThe Olympiad has 72 topics, including engineering, computer science, quantum technologies and more.\n\n🏆The winners will get , opportunity to have access to special career portal and subsidized enrollment in top Russian Universities.\n\n📌Olympiad dates: from Oct 2020 to July 2021. \n📌Application deadline: 24 November 2020\n\n👉More info & apply at ",
      tagIds: [tags["olympiad"].id, tags["computer-science"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2188@24-11-2024_12-02-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_649@05-03-2022_09-45-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: 'Acceleration and educational intensive program "Archipelago...',
      description:
        "‼️Acceleration and educational intensive program \"Archipelago 20.35\" in Innopolis - Take part in selections with machine learning and data science project. If you don\'t have your own project now, it\'s not a problem - you can join participants with a shared idea.\n\n🔺1 Nov - registration deadline\n🔺7 Nov - intensive starts\n🔺21 Nov - project presentation\n\n👉Available  \n👉More info & apply 🇷🇺Language: Russian",
      tagIds: [tags["data-science"].id, tags["machine-learning"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1737@16-04-2024_12-01-55.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "       ",
      description:
        '📣More than 700 participants from 30 Russian universities have already clicked "register" button and are competing for a prize fund of 1,142,000 rubles. Be the next one!\n\n📌Registration will close on 30 Oct. \n👉Register: ',
      tagIds: [tags["contest"].id, tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2324@20-02-2025_18-34-50.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1862@24-06-2024_14-16-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1337@17-09-2023_18-12-15.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Cybersport Tournament - Part 1",
      description:
        "🔥   🔥\n\n👻 We are ready to present you the first part of  online event - Cybersport Tournament!\n\n🥳 We\'ve included Dota 2, CS:GO, Overwatch, LoL, Rocket League, osu, and etc.!\n\n🌟 Tournament information and schedule will be available .\n\n📌 .\n\n📣 \n\n👌Btw, if you have a laptop with Outlast DLC installed (or just Outlast) - please message  :)\n\n📌The tournament will happen this weekend, October 31st - November 1st",
      tagIds: [tags["cybersecurity"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_885@08-11-2022_11-38-26.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1511@24-12-2023_19-05-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis Skateboarding LIT!",
      description:
        "🛹  🛹\n\n🎥 Starting this Friday (!TOMORROW!) we’re shooting a LIT🔥  to promote skateboarding and roller sport on the whole at Innopolis! \n\n🌚🌝 If you’re willing to show a couple of tricks, know how to shoot, film-edit or just can ride in a straight line, text me in PM:  🐸.\n\n‼️Attention, in addition to filming we are going to just chat and  (flex n’ chill)! \n\n😎All this movement is organized with the support of Skateboarding Club, tap-tap  \n\n👉👉Join .",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1894@10-07-2024_13-00-52.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_845@10-10-2022_19-35-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_846@12-10-2022_12-56-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1522@15-01-2024_18-15-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Korston - developer and operator of hotel, shopping and...",
      description:
        "📣- working with the database;\n- setting up analytics via Navision;\n- working with end-to-end analytics;\n- setting up systems like  or ;\n- conducting digital marketing;\n- optimizing current processes\n\n⭐️Korston - developer and operator of hotel, shopping and entertainment complexes.\n\n🇷🇺Language: Russian\n📌Start date: ASAP\n👉For more info and applying please message  by Monday 9am.",
      tagIds: [
        tags["internship"].id,
        tags["data-science"].id,
        tags["business"].id,
        tags["job-fair"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_917@30-11-2022_10-07-43.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1796@28-05-2024_09-05-12.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1890@09-07-2024_11-33-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Meetup Podcast about FUNDRAISING IN THE GAME INDUSTR",
      description:
        "📣On November 2,  will hold a meetup podcast about fundrasing in the gaming indusrty. \n\nMr. Tim Raiter the designer and entrepreneur from Donut Lab  gaming studio, founder of SuitUp online fitting room and Hello Baby the ecosystem of parental apps will talk about the industry specifics, investments\' deal structure, cap table, publishers, game conferences and other important related topics. \n\nWe\'ll talk about fundraising tips and tricks for fundraising in the gaming industry, about Donut Lab experience started from an idea to the Seed Round that was led by Wargaming, Level-Up, Starta Capital, and others. \n\nJoin us to become a member of the Go Global World community by subscribing to all its social media by this and get free acces to all three event!\n\n📌Mon, November 2, 8:00 PM\n\n👉More information and registration to the event is .",
      tagIds: [tags["game"].id, tags["talk"].id, tags["startups"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_947@17-12-2022_17-30-28.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2585@23-06-2025_16-01-39.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1120@05-04-2023_10-01-32.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Student Media Story Contest",
      description:
        "📣🔹Minimum 500 words. \n🔹Language: English\n\n1. Create story name and register it  by Wednesday 23:59\n2. Write a story and submit it by 17 November 23:59. Submission details will be sent to all participants personally.\n\n✅We are . There will be at least 5 judges to select the best stories.\n\n🏆Top 3 stories will obtain certificates and will be published in Student Media monthly journal.",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1809@03-06-2024_10-01-08.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_941@15-12-2022_14-00-24.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Write a Story of Your Own",
      description:
        "📣Write a story of your own in your preferred style and on your preferred topic!\n\n🔹Minimum 500 words. \n🔹Language: English\n\n1. Create story name and register it \n2. Write a story and submit it by 17 November 23:59. Submission details will be sent to all participants personally.\n\n🏆Top 3 stories will obtain certificates and will be published in Student Media monthly journal.",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1188@18-05-2023_12-01-32.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_822@20-09-2022_13-51-50.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1178@10-05-2023_10-41-20.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1282@07-08-2023_12-01-25.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Make University merch cooler and brighter together!",
      description:
        "🎨 - let\'s make University merch cooler and brighter together!\n\n✅Purpose: olympiads, schoolchildren camps.\n\n\n\n🔹Those with ideas but without skills: write down ideas for merch & drawings \n🔹Those who have ideas and skills: draw it and send it in png or pdf formats.\n\n🏆What will you get? The winners will get merch with their own ideas!\n\n👉Apply  by 10 December 2020\n👤Any questions? Feel free to contact ",
      tagIds: [tags["contest"].id, tags["olympiad"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1810@04-06-2024_10-55-16.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1051@02-03-2023_15-00-53.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_849@12-10-2022_18-05-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Recruiting: Russian speaking teacher in Robotics",
      description:
        "📣Recruiting: Russian speaking teacher in Robotics.\n\n‼️Paid position\n👤Taught to: children of 1-3 grade\n📌Held at IU on Saturdays.\n👉For all questions contact ",
      tagIds: [tags["robotics"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1220@18-06-2023_19-10-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_619@08-02-2022_12-32-17.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Armwrestling Tournament November 21st at 9am IU,",
      description:
        "📣Armwrestling Tournament\n⏰November 21st at 9am\n📌IU, 3rd floor, Green Stairs\n\n👉Register . Application deadline 19 November, 12:00\n\n🏆Also, join Armwrestling chat !\n\n🙏Spectators are welcome too!",
      tagIds: [tags["sports"].id, tags["talk"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2024@18-09-2024_14-16-54.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1323@08-09-2023_17-01-42.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1931@29-07-2024_15-10-02.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University, 22 November, Sunday, 3pm",
      description:
        '📣\n\nThis lecture will be helpful not only for game development programmers, but also for studying at Innopolis University.\n\n📌22 November, Sunday, 3pm\n📍313, Innopolis University\n👨‍💻 Vladislav Kantaev, "IGD Club", technical director \n\n‼️P.S.: If there are people, who don\'t speak Russian - the lecture will be in English, otherwise in Russian.',
      tagIds: [
        tags["lecture"].id,
        tags["programming"].id,
        tags["computer-science"].id,
        tags["game"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Accounts Chamber of Russia — Accounts Chamber of Russia",
      description:
        "📣\n\nPresent your work to industry experts, expand your network of professional contacts and apply your solutions into operational processes of the Accounts Chamber\n of Russia.\n\n▪️Over 15 tasks and problem areas to select and solve.\n▪️Experts assigned to each team\n▪️One month to develop a solution\n\n👤3-4 year bachelors, master degree students\n📌Application deadline: 27 Nov\n",
      tagIds: [tags["internship"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "RuCode is an all-Russian online training festival on...",
      description:
        "📣 \n\nRuCode is an all-Russian online training festival on artificial intelligence and algorithmic programming. Take part in C or D divisions and get advanced training certificate!\n\n✅Registration \n👉Any questions .\n\n‼️Also, the organizers are doing their best to improve and here\'s a short feedback form for you where you can indicate reasons for not taking part in RuCode. Please fill the  if you want and have time.",
      tagIds: [
        tags["artificial-intelligence"].id,
        tags["programming"].id,
        tags["festival"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "PokerInno - Be A Winner!",
      description:
        "📣📌Saturday, Nov 28th, 18:00 in rooms 312 and 314.\n \nLanguage: 🇷🇺🇬🇧 \nDrinks, snacks & nice chat included🥐🥤\nAll levels are welcome!👱‍♂️👩‍🦳\n\n👉To take part in the competition:\n\n1) Fill the  \n2) Join  with announcements\n\n👉For questions:  or \n🌐\n🔥PokerInno - Be A Winner!",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1888@04-07-2024_17-48-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1181@11-05-2023_13-53-12.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1735@15-04-2024_19-03-58.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1391@21-10-2023_12-31-04.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University and ArtSpace are going to host an ,",
      description:
        "📣Innopolis University together with ArtSpace are going to host an , which will be broadcasted .\n\n👉If you wish to take part please register yourself .\n\n‼️One quick test screening  in ArtSpace rep studio at your convenient time. It will help to ensure technical provision for your act.\n\n‼️Only \'mic\' performances are allowed. Unfortunately, no dancing will be included into the program.\n\n📌Application deadline: Monday 15:00",
      tagIds: [tags["talk"].id, tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2491@25-04-2025_17-22-00.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_543@24-11-2021_18-08-28.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2212@06-12-2024_14-57-17.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1891@09-07-2024_16-17-01.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis University and ArtSpace are going to host an ,",
      description:
        "📣Innopolis University together with ArtSpace are going to host an , which will be broadcasted .\n\n👉If you wish to take part please register yourself .\n\n‼️One quick test screening  in ArtSpace rep studio at your convenient time. It will help to ensure technical provision for your act.\n\n‼️Only \'mic\' performances are allowed. Unfortunately, no dancing will be included into the program.\n\n📌",
      tagIds: [
        tags["talk"].id,
        tags["programming"].id,
        tags["contest"].id,
        tags["music"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_899@18-11-2022_10-54-55.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "TG Hackathon — Team Search",
      description:
        '📣Registration for the Hackathon has two stages. Follow registration instructions .\n\n👥The team can be found in the "Team Search" TG chat, as well as on the Hackathon platform itself.\n\n👉more info \n‼️Teams must have 3-5 people\n📌Application deadline: 07.12.2020.',
      tagIds: [tags["hackathon"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1915@17-07-2024_15-19-09.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1756@27-04-2024_14-25-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2341@27-02-2025_14-16-12.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "How to be as pretty as possible for the destiny?",
      description:
        "📣Small black dress, perfume #5 are far from all the ideas that turned the world of fashion upside down. We will look at her work and talk about her life.\n\n\"I don\'t understand how a woman can leave the house without fixing herself up a little - if only out of politeness. And then, you never know, maybe that\'s the day she has a date with her destiny. And it\'s best to be as pretty as possible for the destiny.\"\n\n📌When: December, 4th, 19:45 - 21:00\n📌Where: ArtSpace, coworking space\n‼️Cost: 250 rub. First lecture is free\n🇷🇺Language: Russian\n👉Join the chat ",
      tagIds: [tags["seminar"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_797@31-08-2022_17-12-38.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1121@05-04-2023_12-01-29.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Kazan-Innopolis-Kazan",
      description:
        "📣\n\n- Giving out and collection of equipment;\n- Assisting to choose equipment;\n- Processing orders\n- Controlling condition and safety of equipment\n\n- Responsibility;\n- Punctuality;\n- Friendliness;\n- Strong work ethic\n\nWork schedule: 2/2, shift; 10-22\nFree transfer Kazan-Innopolis-Kazan;\nFriendly, responsive and energetic team.\nSalary: 25000 before tax\nContract length: until 31.03.2020\nLanguage requirement: fluent Russian\n\n👉To apply contact ",
      tagIds: [tags["internship"].id, tags["business"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2317@19-02-2025_14-03-06.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Junior Developer Developer Job Description",
      description:
        "📣👉You can upload your resumes . It must contain:\n\n- Your skills\n- Your experience\n- Salary expectations\n- Desired number of work hours per week\n- What exactly do you want to do as a Junior Developer",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1701@25-03-2024_15-51-48.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Best design will be selected for production.",
      description:
        "📣\n\n👕Best design will be selected for production.\n👤Questions: \n👉More info ",
      tagIds: [tags["design"].id, tags["contest"].id, tags["hackathon"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "- to find music for the festival - to manage audio streams...",
      description:
        "📣 \n\n👇- to find music for the festival\n- to manage audio streams and put the music between speeches\n\n📌Dates: 15-20 December\n‼️\n\n👉To apply: \n📌Application deadline: today 17:00",
      tagIds: [
        tags["programming"].id,
        tags["machine-learning"].id,
        tags["artificial-intelligence"].id,
        tags["internship"].id,
        tags["music"].id,
        tags["festival"].id,
        tags["cybersecurity"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2580@20-06-2025_12-04-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1498@19-12-2023_16-00-59.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2528@20-05-2025_17-57-30.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1457@21-11-2023_14-30-44.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Soramitsu are looking for iOS and Android developers",
      description:
        "🧰 Soramitsu are looking for iOS and Android developers.\n\n \n\n👉To apply: ",
      tagIds: [tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2202@03-12-2024_09-05-12.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2486@24-04-2025_16-02-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_744@19-05-2022_10-12-37.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Today, 19:00 Big Hall, Sport Complex",
      description: "📣\n\n📌Today, 19:00\n📌Big Hall, Sport Complex\n\n😎",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_757@03-06-2022_09-00-22.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Join our and follow our news.",
      description:
        "📣 🎄\n\n👉Join our  and follow the news.\n\n- Workshop capacity: 20 people\n- All participants need to have their own scissors\n\n 16 December, 16:00, room 314",
      tagIds: [tags["workshop"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1176@07-05-2023_19-00-09.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_760@10-06-2022_11-38-31.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_608@31-01-2022_17-01-20.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Russian IT companies involvement in domestic film industry:...",
      description:
        "📣\n\n🔹 Russian IT companies involvement in domestic film industry: production, storage and distribution of audiovisual content for cinemas; television and online services.\n\n🔹 to establish partnerships between two industries in technological domain.\n\n\n\n- TV channels’ representatives, producers\n- SEZ Innopolis companies, partners and start-ups; Innopolis University students and staff\n\n📌18 Decemberб 15:00~18:00\n👉More info & apply 🇷🇺Language: Russian",
      tagIds: [tags["conference"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1953@22-08-2024_16-08-50.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2193@26-11-2024_18-34-30.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "    ",
      description:
        "🧰🔹Starting from January\n🔹Hours are discussed\n🔹Pay rate: 1-1.5k r/h depending on experience.\n\n‼️Both Russian and English candidates are considered.\n\n‼️Teaching experience is required.\n\nTo apply: ",
      tagIds: [tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1725@05-04-2024_15-51-55.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "16.00, room 102",
      description: " drawing TODAY for us!\n\n😉See you at 16.00, room #102",
      tagIds: [tags["art"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Phantom OS: a low-level programming project",
      description:
        "📣\n\nAre you interested in operating systems and low-level programming? And you are wondering if it is possible to make something new in operating systems?\n\nIf yes join presentation where you will be given an overview of Phantom OS, one of the university projects. And if you want to get involved in it you\'ll be offered problems that you can take as topics for your internship, course project, or even a thesis. \n\n📌When: 24th of December at 12:00\n📌Where: room 106 or Zoom (link will be provided later)",
      tagIds: [
        tags["computer-science"].id,
        tags["seminar"].id,
        tags["programming"].id,
        tags["lecture"].id,
        tags["conference"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2176@20-11-2024_16-00-51.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_695@06-04-2022_11-15-05.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_951@20-12-2022_09-53-33.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_975@20-01-2023_15-05-29.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Application deadline: 19 January More info .",
      description:
        "🧰 \n\n- Python, Java, Scala and iOs developers\n- Frontend developer\n- QA engineer\n- DevOps, ML engineer\n- Junior native advertising manager\n- Junior blogger manager\n\n📌Application deadline: 19 January\n👉More info . Apply ",
      tagIds: [
        tags["internship"].id,
        tags["programming"].id,
        tags["job-fair"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1950@21-08-2024_17-29-05.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2478@21-04-2025_09-59-20.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1860@24-06-2024_10-11-39.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1757@27-04-2024_16-08-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Global Crisis Conference : .",
      description:
        "📣: .\n \nThe purpose of the conference is to provide students with an opportunity to explore potential global crises that may happen over the next 50 years and propose possible solutions with policies, technology, and innovative ideas. \n\nTop 3 teams in each division (for every scenario) will be awarded with the following prizes:\n\n1st prize: $5000\n2nd prize: $2000\n3rd prize: $1000\n \n👉More info and apply on  website.\n\n",
      tagIds: [tags["conference"].id, tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1479@08-12-2023_17-30-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1741@17-04-2024_17-28-58.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2584@23-06-2025_14-06-24.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "React MobX, React MobX, Redis,",
      description:
        "🧰Group-IB is a new generation of engineers who embody bold and innovative ideas for early detection of cyberattacks.\n\n🔹 Python3, Django, DRF, Redis, MySQL, Docker, React + MobX, Linux (Ubuntu / Debian)\n\n- Python, its object model and standard data structures\n\n- Linux. (Ubuntu / Debian)\n- MySQL and an understanding of the basic principles of database building\n- Docker / Docker-compose\n\n✅Vacancy is based in Innopolis.\n👉Apply: ",
      tagIds: [
        tags["cybersecurity"].id,
        tags["computer-science"].id,
        tags["programming"].id,
        tags["data-science"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Node.js Experience",
      description:
        "🧰Project length: 1-3 months.\n\n1. Frontend & backend programming.\n2. Node.js experience\n3. Self supportiveness and result orientation\n4. Video and audio streaming understanding.\n\n✅Desired outcome will be a test version of the account page with video conference based on Zoom and several experimental features for online education.\n\n👉Application and questions: \n🇷🇺🇬🇧No specific language requirements",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1646@04-03-2024_19-05-31.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_779@02-07-2022_12-04-42.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1112@30-03-2023_17-45-57.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Phantom OS: a low-level programming project",
      description:
        "📣Are you interested in operating systems and low-level programming? And you are wondering if it is possible to make something new in operating systems?\n\nIf yes join presentation where you will be given an overview of Phantom OS, one of the university projects. And if you want to get involved in it you\'ll be offered problems that you can take as topics for your internship, course project, or even a thesis. \n\n📌When: Today at 12:00\n📌Where: room 106 or ",
      tagIds: [
        tags["computer-science"].id,
        tags["seminar"].id,
        tags["lecture"].id,
        tags["programming"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Ahmad Hamdan - Furqan Haider - Albert Nasy",
      description:
        "📣\n\n✅ - Ahmad Hamdan\n- Furqan Haider\n- Utkarsh Kalra\n- Albert Nasybullin\n\n📌When: today at 7pm\n🇬🇧Language: English\n🔥Only 18+ audience\n‼️Important: please bring your masks\n\n👉🍹",
      tagIds: [tags["concert"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_476@29-09-2021_16-30-04.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_467@24-09-2021_14-51-39.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1870@27-06-2024_13-23-50.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Blockchain engineer - AI specialist - full stack,...",
      description:
        "🧰 🔹Available positions:\n\n- Blockchain engineer/expert\n- AI specialist\n- ML engineer\n- full stack, frontend/backend developer\n- UI/UX designer\n\n👉More info & apply: ",
      tagIds: [tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1022@14-02-2023_20-01-56.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1397@24-10-2023_13-43-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1328@12-09-2023_15-00-44.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2574@17-06-2025_11-05-19.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis Cricket Club invites you to take part in a",
      description:
        "📣Innopolis Cricket Club is inviting you to take part in the master class of cricket - a famous worldwide game.\n\n📌Friday, Jan 15th, 20:00-22:00 in Big Hall, Sports Complex\n\n👉Join  for further announcements!",
      tagIds: [
        tags["master-class"].id,
        tags["sports"].id,
        tags["club-meeting"].id,
        tags["programming"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_901@19-11-2022_14-30-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "адров еерв е",
      description:
        '📣"Кадровый Резерв" is a one-year program for those who want to develop their ideas and are looking for knowledge resources, like-minded people and mentors. This program can give you tools to achieve your goals.\n\nThis year\'s tracks:\n\n- personal efficiency\n- teamwork and communication\n- project development and social impact\n\n👉More info on ',
      tagIds: [tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2453@10-04-2025_12-33-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2199@02-12-2024_09-09-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_587@17-01-2022_14-01-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "KGAU 2005 - School of Innopolis",
      description:
        "📣17:30 - Team greetings & warm up\n17:45 - KGAU 2005 - School of Innopolis\n18:55 - KGAU - Innopolis University\n\n📌Where: Big Hall, Sport Complex\n🙏Come and support our teams!",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2592@28-06-2025_18-19-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1052@03-03-2023_15-30-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1159@22-04-2023_09-29-58.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Kazan, 26 January, 10:30, Kazan",
      description:
        "📣\n\n📌26 January, 10:30, Kazan\n\nParticipants: university students, 1995 year of birth or younger. Team of 5 + 2 subs. Only one team per university. Prizes: trophies, diplomas, money certificates.\n\n👉To apply message  by the end of today!",
      tagIds: [tags["contest"].id, tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1358@02-10-2023_14-15-18.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1207@05-06-2023_15-01-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1802@29-05-2024_09-10-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2413@27-03-2025_19-09-38.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Nomination deadline: March 1, 23:59 Reward amount: 1 million",
      description:
        "📣\n\n- Machine learning;\n- Computer vision;\n- Information retrieval and data analysis;\n- Natural language processing and machine translation;\n- Speech recognition and synthesis.\n\nUndergraduate and graduate students can apply for the award themselves, as well as nominate scientific advisors.\n\n📌Deadline: March 1, 23:59\n✅Reward amount: 1 million rubles.\n👉More info & apply .",
      tagIds: [
        tags["machine-learning"].id,
        tags["contest"].id,
        tags["artificial-intelligence"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Developer Student Club — Flutter App for Startup Names",
      description:
        "📣  - learn about Developer Student Club and it\'s mission, as well as learn more about Flutter and where we can use it.\n\n🔥 You\'ll be able to create Flutter App for generating startup names with help and guidance from workshop experts.\n\n😊 This workshop is perfect for those who want to get their first mobile dev experience and find new acquaintances. \n\n✅DSC info channel: \n📌January 25, 6-9pm\n👉Register  by 23 January.",
      tagIds: [tags["workshop"].id, tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1325@11-09-2023_11-16-56.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "- Volume-based salary (cost of one delivery is 70 rubles",
      description:
        "🧰\n\n🔹\n\n- volume-based salary (cost of one delivery is 70 rubles)\n- Delicious lunch if you\'ve worked more than 4 hours (and sometimes a glass of beer) \n- Training provided \n- Flexible schedule\n- Friendly spirit in a strong team \n\n🔹\n\n- hourly pay rate \n- Delicious lunch if you\'ve worked more than 4 hours (and sometimes a glass of beer) \n- Training provided \n- Flexible schedule\n- Friendly spirit in a strong team \n\n👇What we expect from you: \n\n- Reliability \n- Speed and accuracy \n- Quality work \n\n👉To apply: ",
      tagIds: [tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1643@03-03-2024_14-43-32.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_521@10-11-2021_09-01-29.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "International contest for young people in entrepreneurship",
      description:
        '📣\n\nInternational contest, which aims to unfold youth potential in entrepreneurship, IT, project management and team work. \n\n\n\n- acceleration "Start Up" business course\n- pilot projects in partner companies\n- recreation camp trips\n- valuable prizes (iPhone, Mac, SonyPlaystation, etc.)\n\n🔹Participants: students 18-23 y/o.\n📌Application deadline: 27 January\n👉More info in ,  or . \n👉Apply .',
      tagIds: [tags["contest"].id, tags["startups"].id, tags["business"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1108@29-03-2023_15-31-33.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2598@02-07-2025_11-59-57.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Community of students who are united by art",
      description:
        "📣\n\nHere\'s an attempt to give life to community of students who are united by art and passion for artistic expression.\n\n👇\n\n- you can lead and run art or crafts classes\n- you have any ideas for such club\n- you just want to learn some arts and attend future meetings\n\n✅",
      tagIds: [tags["programming"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1034@22-02-2023_13-32-23.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1310@31-08-2023_17-50-05.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2175@20-11-2024_14-01-26.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Become a better comedian and actor",
      description:
        "📣\n\n👇\n\n- take part in various brainstorm practices\n- perform activities that will help you to become a better comedian and actor\n\n✅The meetings will be run by one PhD student with relevant experience.\n\n🇷🇺👉Join the  if you think (or others think) you have a good sense of humor!",
      tagIds: [tags["workshop"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Part-time jobs presentation at Innopolis University",
      description:
        "🧰\n\nPart-time jobs presentation for students who are wishing to join a lab at Innopolis University.\n\n📌27 January, 16:20\n📌Room 105\n🇬🇧Language: English\n‼️Job application from foreign students will also be considered.\n\n👉Sign up for the meeting  by Monday 9am.\n\n✅Also reminding about resume upload page. Attach your CV  to make it visible to employers.",
      tagIds: [tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2052@03-10-2024_14-11-19.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Dance , . Contemporary is an expressive dance form with...",
      description:
        "📣🔹Contemporary is an expressive dance form with a free, artistic and creative feel. See , .\n\n🔹High Heels is a dance form named after women\'s shoe style, since one of its distinguished features is wearing high-heeled shoes during performance. See , .\n\n📌24.01, Sunday, Sport Complex, 223\n💃🏻Invited choreographer: 💲👉\n👉More info about future master classes & regular sessions is available .",
      tagIds: [
        tags["dance"].id,
        tags["programming"].id,
        tags["master-class"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1341@19-09-2023_12-00-26.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Espaol Amigo",
      description:
        '📣The "Español Amigo" welcomes those who wants to learn Spanish and practice it with native speakers!\n\nThe club will involve activities related to language learning, such as watching films, talking about Spanish music and so on. It will be a very entertaining group!\n\n👉Meeting times will be decided in the group, so !',
      tagIds: [tags["language-learning"].id, tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1881@03-07-2024_13-20-25.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2194@27-11-2024_15-56-37.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2009@11-09-2024_12-01-24.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Terra Mystica (TM) — Terra Mystica (TM",
      description:
        "📣🌱 The game is Terra Mystica (TM) 🔥 \n🕐 Average time per match: 3 hours\n🐧 Number of players: 4-5\n📌 When: 30-31 January 12:30\n\n👉For rules and more info please visit the .\n📌Application deadline: 29 January\n👉For questions please contact ",
      tagIds: [tags["game"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2351@03-03-2025_21-30-22.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Experienced Frontend Developer from Innopolis based startup",
      description:
        "🧰 experienced frontend developers from Innopolis based startup - online academy Supra\n\nProject length: 1-3 months.\n\nWhat experience will help you:\n1. Frontend programming\n2. ReactJS experience\n3. Experience with Git\n4. Knowing GraphQL (ApolloClient) would be great.\n5. Self supportiveness and result orientation\n\n✅Desired outcome will be a test version of the account page, admin dashboard and several experimental features for online education\n\n👉Application and questions: ",
      tagIds: [tags["internship"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Acceleration Program — Acceleration Program",
      description:
        "📣\n\n- Get expert assessment of your project\n- Be trained by the top experts\n- Master the skills of conducting effective business presentations\n- Reach new level of negotiations with investors\n- Get investment support\n\n‼️🔹 Over 200 projects by high-tech entrepreneurs\n🔹 Up to € 1,000,000 investment for the winners of Acceleration Program\n\n👉Check the program  \n👉Register ",
      tagIds: [tags["business"].id, tags["startups"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2575@17-06-2025_11-42-52.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2072@09-10-2024_17-32-26.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1534@26-01-2024_12-30-22.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2315@18-02-2025_17-29-54.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "InnoStage: The Book of Business Analyses",
      description:
        "📣\n\nVadim Mironov, the author of the book and the head of business analysis group InnoStage, will talk about how the book was created and how it can be useful for novice business analysts.\n\nThe event will be held in Zoom. \n\n📌Today, 16:30.\n🇷🇺Event language: Russian\n👉You can connect via this . Conference ID: 910 5180 4927.\n\n",
      tagIds: [tags["conference"].id, tags["business"].id, tags["lecture"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Indicator in Innopolis Indicator in Inno",
      description:
        "📣\n\nThis course is suitable for those who dreams of making games and starting a career in gaming industry.\n\n🇷🇺Language: Russian\n🔹Course start: 20 Feb\n🔹Course length: 3 months\n🔹Number of spaces: 30\n📌Location: Technopark\n 20 Feb.\n👉— principles of game design, programming in Unity, and working with 3D art \n— personal feedback and weekly support in your “from idea to release” path\n\n👤\n\n— Anton Skudarnov, CEO Indie GameDev Club \n— Evgeny Ageev, curator of the Indicator in Innopolis \n\nIndicator in Innopolis group:  \nAny questions: ",
      tagIds: [tags["game"].id, tags["seminar"].id, tags["design"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_836@05-10-2022_12-06-49.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2272@06-02-2025_10-04-58.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1290@22-08-2023_18-13-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Sirius University (Sirius University)",
      description:
        "📣\n\nBoth fundamental and applied research projects can be submitted to the competition. Participants need to formulate a clear goal with proposed plan and predicted measurable result.\n\n🔹 \n🔹 \n🔹 \n\n🏆The winners will receive additional points upon admission to Sirius University and the opportunity to study in short-term educational modules without competitive selection.\n\n👤2-3 year bachelors & masters\n👉More info & apply .\n📌Application deadline: 23 Feb",
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2027@19-09-2024_13-13-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_903@21-11-2022_16-55-44.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1645@04-03-2024_16-05-27.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_793@19-08-2022_13-19-38.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "If you are already 18, you are energetic, you enjoy...",
      description:
        "🧰If you are already 18, you are energetic, you enjoy communicating with children, you are ready for endless interesting activities - then you are a perfect candidate!\n\n- Free food and accommodation\n- Merch\n- Decent salary\n\n- Desire to become part of a cool team\n- Passion for work with children children\n- Strong organization skills and responsibility\n- Both English & Russian speakers are welcome to apply!\n\n👉Apply !\n👤For questions: ",
      tagIds: [tags["job-fair"].id, tags["internship"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_605@28-01-2022_17-30-46.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Information Technologies Innovation Exact Sciences Physics...",
      description:
        "📣\n\nThe conference unites leading universities and industrial enterprises to enable worthy candidates and young specialists find application for their abilities and gain practical skills in various fields.\n\n👇🔹Information Technologies\n🔹Innovation\n🔹Exact Sciences\n🔹Physics & Astronomy\n🔹Technology\n🔹Cyberphysical Aerospace systems\n🔹and more...\n\n📌Selection stage: 1 Feb - 10 Sept.\n📌Conference: 25 Oct - 3 Nov (online) or 5 Nov - 7 Nov (Offline)\n\n👉More info is available  or on  and .",
      tagIds: [tags["conference"].id, tags["job-fair"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1039@25-02-2023_11-01-34.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_863@25-10-2022_15-16-09.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Secret safe with a jackpot found in Innopolis",
      description:
        "📣A secret safe with a jackpot was found in Innopolis. We know its location, but so far no one has managed to crack the security code. Perhaps you can find the numbers you want!\n\n📌23 Feb 16:00-19:00\n📌ArtSpace",
      tagIds: [tags["cybersecurity"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_916@29-11-2022_16-28-50.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Movie in English Rus Sub - series of short films in Russian",
      description:
        "📣- movie in English [Rus Sub]\n- movie in Russian [Eng Sub]\n- series of short films in Russian\n\n👉Please vote for your favorite films  by the end of Wednesday. One film for each language will be selected according to your vote.",
      tagIds: [tags["contest"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "How to find a job for girls?",
      description:
        "📣\n\n👇 Katerina will share her experience on the following topics: \n\n- how much gender matters in employment?\n- is it harder to find a job for girls?\n- current salary rates in the industry\n- how to get a promotion?\n- career alternatives for developers\n\n👉 Please register  if you wish to attend the meeting\n\n",
      tagIds: [
        tags["seminar"].id,
        tags["job-fair"].id,
        tags["conference"].id,
        tags["workshop"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2451@09-04-2025_13-07-18.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1805@30-05-2024_18-27-56.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1834@11-06-2024_11-20-48.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Innopolis Masterclass",
      description:
        "📣🐝 Our dear friends from  will come to Innopolis and bringing new exciting games with them!\n\n⚔️ Join us for a Masterclass to learn to play . Take part in an epic, chaotic fight among pirates, zombies and even dinosaurs with lasers!\n\n🔥 Discover amazing games made available \n\n📌 When: February 27, 16:00\n🔑 Where: room 313\n🗣 Language: Russian \n👉 Register via this 👉For questions please contact , ",
      tagIds: [
        tags["master-class"].id,
        tags["conference"].id,
        tags["seminar"].id,
      ],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Pilotless Aerial Vehicle Contest",
      description:
        '📣\n\nYou will undergo learning modules and compete in creating real solutions for industry needs.\n\n1. "Introduction to pilotless aerial vehicles"\n2. "Remote and offline piloting"\n3. "Artificial intelligence"\n\nThe aim of the contest is to form an innovative thinking model among students through distributed project trainings to implement domestic hardware and software solutions.\n\n👉For more info please message  by 16:00 today.',
      tagIds: [tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2410@25-03-2025_17-38-25.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2482@22-04-2025_13-58-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1267@19-07-2023_16-30-40.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "The largest project in Russia and the CIS countries",
      description:
        "📣\n\nThe tour has been held in different cities of Russia since 2011 and now is the largest project in Russia and the CIS countries aimed at developing technological entrepreneurship and identifying promising innovative projects.\n\n17 March - Tver\n22 March - Ufa\n25 March - Samara\n\n🔹Present your idea and look at others!\n🔹Learn from experienced people\n🔹Attract investors, create networks and go global!\n\n‼️Participation is free!\n👉More info ",
      tagIds: [
        tags["business"].id,
        tags["startups"].id,
        tags["conference"].id,
        tags["seminar"].id,
        tags["workshop"].id,
      ],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2604@05-07-2025_12-01-46.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2070@09-10-2024_11-36-07.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1368@05-10-2023_16-01-36.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Public Speaking Debates Education Zone Chit-chat Club...",
      description:
        "📣🔹Public Speaking\n🔹Debates\n🔹Education Zone\n🔹Chit-chat\n\n🗣Club meetings will happen occasionally once one of the branches is ready to perform.\n\n to stay informed about upcoming Talk Space gatherings.\n\n about Talk Space",
      tagIds: [tags["club-meeting"].id, tags["talk"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1230@27-06-2023_19-01-32.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1269@21-07-2023_16-01-40.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1435@12-11-2023_12-01-44.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2049@03-10-2024_09-40-56.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Volunteers for Functional Multisport Race 2021",
      description:
        '📣\n\n🔹Meeting assistants at "Personnel for the future" working meeting chaired by the Deputy Prime Minister of the Russian Federation Dmitry Chernyshenko on March 6, 10:00-13:00. Apply  by 🔹Volunteers for Functional Multisport Race 2021 on April 18. Apply  by March 9.\n\n👉More volunteering opportunities are available .',
      tagIds: [tags["volunteering"].id, tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1090@23-03-2023_13-01-13.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Prizes from Sport Complex of Innopolis",
      description:
        "📣\n\n🔹Teams of 3 people\n🔹At least one girl in a team\n🔹You will have 4 disciplines.  \n🔹Read the rules .\n\n🔸Prizes from Sport Complex\n🔸Points for higher scholarship \n🔸Sport hours\n🔸Diplomas\n🔸Medals \n\n📌When: 18 of April, 11:00\n📌Where: Sport Complex of Innopolis\n👉 via this . \n\n👉Contact  if you have any questions!",
      tagIds: [tags["sports"].id, tags["contest"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1302@30-08-2023_15-01-25.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: '"Personnel for the Future" working meeting chaired by',
      description:
        '📣"Personnel for the Future" working meeting chaired by the Deputy Prime Minister of the Russian Federation Dmitry Chernyshenko\n\n📌March 6, 10:00-13:00\n\n🔹Meeting assistants at the Q&A sessions\n🔹Hospitality volunteers for visiting rectors\n\n😎👉Apply  by 15:00 today!\n‼️Fluent Russian is a must.',
      tagIds: [tags["volunteering"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_567@09-12-2021_17-55-11.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1759@28-04-2024_20-00-43.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1327@12-09-2023_12-01-59.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Compete in 4 disciplines! !",
      description:
        "📣, \n\nHave a team of 3 people with at least one girl in it and compete in 4 disciplines!\n\n👥 !\n\n👉The captain must register the team .\n👉For questions: \n📔Read the rules .",
      tagIds: [tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1933@01-08-2024_15-03-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1791@24-05-2024_12-01-22.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_579@24-12-2021_17-48-01.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1148@18-04-2023_10-01-03.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Tea Drinking on Programming Effectiveness",
      description:
        "📣The research is about analyzing the effect of tea drinking on the effectiveness and attentiveness of software developers.\n\nYou\'ll be required to spend 45 minutes solving programming tasks.\n\n👉More info & apply .",
      tagIds: [tags["programming"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "How to deal with panic attacks?",
      description:
        "‼️‼️\n\nAmong the whole spectrum of emotions in the modern world, a person sometimes has to deal with such a reaction as a panic attack.\n\n🏖 H we are going to discuss with the specialist on our workshop tomorrow!\n\n\n📌March 11, (tomorrow) 16:00 - 18:00, room 102",
      tagIds: [tags["workshop"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2384@15-03-2025_12-02-34.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "Application deadline: April 7, 2021",
      description:
        "📣- volunteering\n- creative youth initiatives\n- youth media\n- patriotic upbringing\n- social lift development\n- sport & tourism\n- student clubs and unions\n- family values strengthening\n- prevention of negative effects in youth environment and intercultural relationships\n\n📌Application deadline:  April 7, 2021\n👉 For more info & application please inbox ",
      tagIds: [tags["volunteering"].id, tags["programming"].id],
    },
    [],
  );

  await createEvent(
    api,
    {
      title: "Public Speaking Debates Education Zone Chit-chat Club...",
      description:
        "📣👉So join us as a listener, as well as take part in table topics session, if you want!\n\n🔹Public Speaking\n🔹Debates\n🔹Education Zone\n🔹Chit-chat\n\n🗣Club meetings will happen occasionally once one of the branches is ready to perform.\n\n to stay informed about upcoming Talk Space gatherings.\n\n about Talk Space",
      tagIds: [tags["talk"].id, tags["club-meeting"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_2091@19-10-2024_14-01-58.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1943@13-08-2024_16-23-57.jpg",
    ],
  );

  await createEvent(
    api,
    {
      title: "ороиловски стрелок",
      description:
        "📣«Что? Где? Почему?»\n«Своя игра»\n«Эрудит-квартет»\n«Интеллектуальное шоу «Ворошиловский стрелок».\n\n🔹Next event is held on 4 April\n🔹Format: offline\n🔹Venue: Synergy University, Moscow\n🔹Price: 600 rubles per person\n\n👉More info: ",
      tagIds: [tags["game"].id, tags["sports"].id],
    },
    [
      "https://scrii.github.io/evops-dummy-photos/photos/photo_747@20-05-2022_15-44-15.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1527@22-01-2024_12-00-02.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_1474@04-12-2023_17-40-19.jpg",
      "https://scrii.github.io/evops-dummy-photos/photos/photo_932@08-12-2022_16-02-03.jpg",
    ],
  );
}
