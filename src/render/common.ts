export function keyToXY(key: string, flip: boolean): { x: number, y: number } {
    const xy = {
        x: 'abcdefgh'.indexOf(key[0]),
        y: '87654321'.indexOf(key[1]),
    };
    if (flip) {
        xy.x = 7 - xy.x;
        xy.y = 7 - xy.y;
    }
    return xy;
}

export const keyRegex = /[abcdefgh][12345678]/g;
