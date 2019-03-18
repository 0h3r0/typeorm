import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../test/utils/test-utils";
import {Connection} from "../../../src";
import {Animal} from "./entity/Animal";
import {NamingStrategyUnderTest} from "./naming/NamingStrategyUnderTest";
import {ColumnMetadata} from "../../../src/metadata/ColumnMetadata";


describe("github issue > #1282 FEATURE REQUEST - Naming strategy joinTableColumnName if it is called from the owning or owned (inverse) context ", () => {

    let connections: Connection[];
    let namingStrategy = new NamingStrategyUnderTest();

    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        namingStrategy
    }));
    beforeEach(() => {
        return reloadTestingDatabases(connections);
    });
    afterAll(() => closeTestingConnections(connections));


    test("NamingStrategyUnderTest#", () => Promise.all(connections.map(async connection => {
        await connection.getRepository(Animal).find();

        let metadata = connection.getManyToManyMetadata(Animal, "categories");

        let columns:  ColumnMetadata[];
        if (metadata !== undefined) {
            columns = metadata.columns;
        } else {
            columns = [];
        }

        expect(columns.find((column: ColumnMetadata) => column.databaseName === "animalIdForward")).not.toBeUndefined();
        expect(columns.find((column: ColumnMetadata) => column.databaseName === "categoryIdInverse")).not.toBeUndefined();

    })));

});
