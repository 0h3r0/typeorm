import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";

describe("github issues > #3352 sync drops text column", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        enabledDrivers: ["mysql"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should not drop text column", () => Promise.all(connections.map(async function(connection) {

        const post = new Post();
        post.id = 1;
        post.text = "hello world";
        await connection.manager.save(post);

        await connection.synchronize();

        const loadedPost = await connection.manager.find(Post, { text: "hello world" });
        expect(loadedPost).toBeDefined();

    })));

});
