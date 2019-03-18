import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../test/utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";

describe("github issues > #1140 timestamp column and value transformer causes TypeError", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("correctly store/load timestamp columns", () => Promise.all(connections.map(async connection => {
        const date = new Date();
        date.setMilliseconds(0); // Because some databases don't have millisecond resolution
        const dateNumber = date.getTime();

        const post = new Post();
        post.ts = dateNumber;
        await connection.manager.save(post);

        const loadedPosts = await connection.manager.find(Post);
        expect(loadedPosts.length).toEqual(1);
        expect(loadedPosts[0].ts).toEqual(dateNumber);
    })));
});
