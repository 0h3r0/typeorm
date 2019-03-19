import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("github issues > #996 already loaded via query builder relations should not be loaded again when they are lazily loaded", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"] // only one driver is enabled because this example uses lazy relations
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should be able to find by object reference", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.name = "Category #1";
        await connection.manager.save(category1);

        const category2 = new Category();
        category2.name = "Category #2";
        await connection.manager.save(category2);

        const post = new Post();
        post.title = "Post #1";
        post.categories = Promise.resolve([category1, category2]);
        await connection.manager.save(post);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .getOne();

        expect(loadedPost).not.toBeUndefined();
        const categories = await loadedPost!.categories;
        expect(categories).toEqual([{
            id: 1,
            name: "Category #1"
        }, {
            id: 2,
            name: "Category #2"
        }]);
    })));

});
