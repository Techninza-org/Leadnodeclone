export const createOptionValues = (values: any): any => {
    return values.map((value: any) => ({
        name: value.name,
        values: value.values ? {
            create: createOptionValues(value.values)
        } : undefined,
    }));
};


export const createOptionData = (options: any) =>
    options.map((option: any) => ({
        name: option.name,
        type: option.type,
        order: option.order,
        values: {
            create: createOptionValues(option.values)
        }
    }));