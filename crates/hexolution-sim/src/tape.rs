use crate::color::base4_to_int;
use crate::js_rng;

#[derive(Clone)]
pub struct Tape {
    pub data: Vec<u8>,
    pub pointer: usize,
}

impl Tape {
    pub fn random(length: usize) -> Self {
        let mut data = vec![0u8; length];
        for slot in &mut data {
            *slot = js_rng::random_base4();
        }
        Self { data, pointer: 0 }
    }

    pub fn from_data(data: Vec<u8>) -> Self {
        Self { data, pointer: 0 }
    }

    fn read(&mut self) -> u8 {
        let value = self.data[self.pointer];
        self.pointer = (self.pointer + 1) % self.data.len();
        value
    }

    pub fn jump(&mut self, n: u8) {
        self.pointer = (self.pointer + (n as usize) * 3) % self.data.len();
    }

    pub fn read_int(&mut self) -> u8 {
        let a = self.read();
        let b = self.read();
        let c = self.read();
        base4_to_int(a, b, c)
    }

    pub fn read_float(&mut self) -> f64 {
        self.read_int() as f64 / 64.0
    }

    /// Matches JS `Uint8Array.join("")`.
    pub fn hash_string(&self) -> String {
        let mut s = String::with_capacity(self.data.len());
        for &b in &self.data {
            s.push(char::from(b + b'0'));
        }
        s
    }
}
