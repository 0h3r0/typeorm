import {Connection} from "../../../src";
import {Car} from "./entity/Car";
import {Plane} from "./entity/Plane";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../utils/test-utils";

describe("github issues > #2800 - Can't override embedded entities in STI implementation", () => {

    let connections: Connection[];

    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    afterAll(() => closeTestingConnections(connections));

    test("should be able to save entity with embedded entities overriding", () => Promise.all(connections.map(async connection => {
        await connection.manager.save(Car, connection.manager.create(Car, {
            engine: {
                horsePower: 42,
                torque: 42
            }
        }));
        await connection.manager.save(Plane, connection.manager.create(Plane, {
            engine: {
                beep: 42,
                boop: 42
            }
        }));
    })));

});
