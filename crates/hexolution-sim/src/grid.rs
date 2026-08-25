const DX_ODD: [i32; 6] = [1, 1, 0, -1, 0, 1];
const DX_EVEN: [i32; 6] = [1, 0, -1, -1, -1, 0];
const DY: [i32; 6] = [0, 1, 1, 0, -1, -1];

#[derive(Clone)]
pub struct Grid<T> {
    pub width: i32,
    pub height: i32,
    cells: Vec<T>,
}

impl<T: Clone> Grid<T> {
    pub fn new(width: i32, height: i32, fill: T) -> Self {
        let len = (width * height) as usize;
        Self {
            width,
            height,
            cells: vec![fill; len],
        }
    }

    #[inline]
    pub fn map_x(&self, x: i32) -> i32 {
        let mut x = x % self.width;
        if x < 0 {
            x += self.width;
        }
        x
    }

    #[inline]
    pub fn map_y(&self, y: i32) -> i32 {
        let mut y = y % self.height;
        if y < 0 {
            y += self.height;
        }
        y
    }

    #[inline]
    pub fn index(&self, x: i32, y: i32) -> usize {
        (self.map_y(y) * self.width + self.map_x(x)) as usize
    }

    #[inline]
    pub fn get(&self, x: i32, y: i32) -> &T {
        &self.cells[self.index(x, y)]
    }

    #[inline]
    pub fn set(&mut self, x: i32, y: i32, value: T) {
        let i = self.index(x, y);
        self.cells[i] = value;
    }

    pub fn coords_by_narrow(&self, x: i32, y: i32, narrow: i32, distance: i32) -> (i32, i32) {
        let mut cur_x = x;
        let mut cur_y = y;
        let n = ((narrow % 6) + 6) % 6;
        for _ in 0..distance {
            let is_odd = cur_y % 2 != 0;
            let dx = if is_odd { DX_ODD[n as usize] } else { DX_EVEN[n as usize] };
            let dy = DY[n as usize];
            cur_x = self.map_x(cur_x + dx);
            cur_y = self.map_y(cur_y + dy);
        }
        (cur_x, cur_y)
    }

}
