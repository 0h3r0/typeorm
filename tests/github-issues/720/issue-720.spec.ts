import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Participant} from "./entity/Participant";
import {Message} from "./entity/Message";
import {Translation} from "./entity/Translation";
import {Locale} from "./entity/Locale";

describe("github issues > #720 `.save()` not updating composite key with Postgres", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should not insert new entity when entity already exist with same primary keys", () => Promise.all(connections.map(async connection => {

        const participants = [];

        participants[0] = new Participant();
        participants[0].order_id = 1;
        participants[0].distance = "one";
        participants[0].price = "100$";

        participants[1] = new Participant();
        participants[1].order_id = 1;
        participants[1].distance = "two";
        participants[1].price = "200$";

        participants[2] = new Participant();
        participants[2].order_id = 1;
        participants[2].distance = "three";
        participants[2].price = "300$";

        await connection.manager.save(participants);

        const count1 = await connection.manager.count(Participant);
        expect(count1).toEqual(3);

        const updatedParticipants = [];
        updatedParticipants[0] = new Participant();
        updatedParticipants[0].order_id = 1;
        updatedParticipants[0].distance = "one";
        updatedParticipants[0].price = "150$";

        updatedParticipants[1] = new Participant();
        updatedParticipants[1].order_id = 1;
        updatedParticipants[1].distance = "two";
        updatedParticipants[1].price = "250$";

        await connection.manager.save(updatedParticipants);

        const count2 = await connection.manager.count(Participant);
        expect(count2).toEqual(3);

        const loadedParticipant1 = await connection.manager.findOne(Participant, { order_id: 1, distance: "one" });
        expect(loadedParticipant1!.order_id).toEqual(1);
        expect(loadedParticipant1!.distance).toEqual("one");
        expect(loadedParticipant1!.price).toEqual("150$");

        const loadedParticipant2 = await connection.manager.findOne(Participant, { order_id: 1, distance: "two" });
        expect(loadedParticipant2!.order_id).toEqual(1);
        expect(loadedParticipant2!.distance).toEqual("two");
        expect(loadedParticipant2!.price).toEqual("250$");

    })));

    test("reproducing second comment issue", () => Promise.all(connections.map(async connection => {

        const message = new Message();
        await connection.manager.save(message);

        const locale = new Locale();
        locale.code = "US";
        locale.englishName = "USA";
        locale.name = message;
        await connection.manager.save(locale);

        const translation = new Translation();
        translation.message = message;
        translation.locale = locale;
        translation.text = "Some Text";
        await connection.manager.save(translation);

        // change its text and save again
        translation.text = "Changed Text";
        await connection.manager.save(translation);

        const foundTranslation = await connection.manager.getRepository(Translation).findOne({
            locale: {
                code: "US"
            },
            message: {
                id: "1"
            }
        });
        expect(foundTranslation).toEqual({
            text: "Changed Text"
        });
    })));

});
