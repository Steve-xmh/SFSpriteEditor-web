function classname(...args: string[]): string {
    return args.filter(v => !!v).join(' ');
}

export default classname