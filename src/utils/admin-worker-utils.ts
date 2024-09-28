export const createOptionValues = (values: any): any => {
    return values.map((value: any) => ({
        name: value.name,
        subOptionValues: value.subOptionValues ? {
            create: createOptionValues(value.subOptionValues)
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