import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../test/utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";
import {Abbreviation} from "./entity/Abbreviation";

describe("github issues > #215 invalid replacements of join conditions", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should not do invalid replacements of join conditions", () => Promise.all(connections.map(async connection => {

        const author = new Author();
        author.name = "John Doe";
        await connection.manager.save(author);

        const abbrev = new Abbreviation();
        abbrev.name = "test";
        await connection.manager.save(abbrev);

        const post = new Post();
        post.author = author;
        post.abbreviation = abbrev;
        await connection.manager.save(post);

        // generated query should end with "ON p.abbreviation_id = ab.id"
        // not with ON p.abbreviation.id = ab.id (notice the dot) which would
        // produce an error.
        const loadedPosts = await connection.manager
            .createQueryBuilder(Post, "p")
            .leftJoinAndMapOne("p.author", Author, "n", "p.author_id = n.id")
            .leftJoinAndMapOne("p.abbreviation", Abbreviation, "ab", "p.abbreviation_id = ab.id")
            .getMany();

        expect(loadedPosts.length).toEqual(1);
    })));

});
