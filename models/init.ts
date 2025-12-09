import { Sequelize } from "sequelize";

const initializers = [];

export function initModel<T>(init: (s: Sequelize) => T) {
    initializers.push(init);
}

export default function init(s: Sequelize) {
    for (const init of initializers) {
        init(s);
    }
}
