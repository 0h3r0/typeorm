import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {User} from "./entity/User";
import {Circle} from "./entity/Circle";

describe("github issues > #1034 Issue using setter with promises", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"] // we are using lazy relations that's why we are using a single driver
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should set members in circle", () => Promise.all(connections.map(async connection => {
        const users: User[] = [];

        const user: User = new User();
        user.setId("1");

        const circle: Circle = new Circle();
        circle.setId("1");

        // Entities persistance
        await connection.manager.save(user);
        await connection.manager.save(circle);

        users.push(user);
        const circleFromDB = await connection.manager.findOne(Circle, circle.getId());
        expect(circleFromDB).not.toBeUndefined();

        // Setting users with setter
        circleFromDB!.setUsers(Promise.resolve(users));
        await Promise.resolve(); // this is unpleasant way to fix this issue
        expect(users).toEqual(await circleFromDB!.getUsers());
    })));

});

