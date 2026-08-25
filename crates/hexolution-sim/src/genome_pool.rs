//! Flat genome buffer with a CLANS3-style free list (port of `clans/genome-pool.ts`).

use crate::constants::{GENOME_BYTES, GENOME_FLAG_INDEX, TOTAL_GENOME_COUNT};
use crate::rng;
use fastrand::Rng;

pub struct GenomePool {
    /// Flat buffer: `genome_index * GENOME_BYTES + offset`.
    pub data: Vec<u8>,
    free: Vec<u32>,
    free_pointer: usize,
    pub mutation_counter: u32,
}

impl GenomePool {
    pub fn new(capacity: usize) -> Self {
        Self {
            data: vec![0; capacity * GENOME_BYTES],
            free: (0..capacity as u32).collect(),
            free_pointer: 0,
            mutation_counter: 0,
        }
    }

    #[inline]
    pub fn capacity(&self) -> usize {
        self.free.len()
    }

    #[inline]
    pub fn available(&self) -> usize {
        self.capacity() - self.free_pointer
    }

    /// Mirrors JS flat-array indexing: reads past a genome spill into the next one,
    /// and reads past the whole buffer yield 0 instead of `undefined`.
    #[inline]
    pub fn get(&self, genome_index: u32, offset: usize) -> u8 {
        let i = genome_index as usize * GENOME_BYTES + offset;
        self.data.get(i).copied().unwrap_or(0)
    }

    #[inline]
    pub fn set(&mut self, genome_index: u32, offset: usize, value: u8) {
        let i = genome_index as usize * GENOME_BYTES + offset;
        if let Some(slot) = self.data.get_mut(i) {
            *slot = value;
        }
    }

    #[inline]
    pub fn mark_used(&mut self, genome_index: u32) {
        self.set(genome_index, GENOME_FLAG_INDEX, 1);
    }

    /// Rebuild the free list and clear usage flags (like `setEmptyGenofond`).
    pub fn refresh_free_list(&mut self) {
        let capacity = self.capacity();
        self.free_pointer = capacity;
        for i in 0..capacity {
            let base = i * GENOME_BYTES + GENOME_FLAG_INDEX;
            if self.data[base] == 0 {
                self.free_pointer -= 1;
                self.free[self.free_pointer] = i as u32;
            } else {
                self.data[base] = 0;
            }
        }
    }

    pub fn acquire(&mut self) -> u32 {
        assert!(
            self.free_pointer < self.capacity(),
            "genome pool exhausted"
        );
        self.free_pointer += 1;
        self.free[self.free_pointer - 1]
    }

    pub fn acquire_random(&mut self, rng: &mut Rng) -> u32 {
        let g = self.acquire();
        let base = g as usize * GENOME_BYTES;
        for i in 0..GENOME_FLAG_INDEX {
            self.data[base + i] = rng::random_byte(rng);
        }
        self.mark_used(g);
        g
    }

    /// Copy a genome and mutate one random byte with the given percent chance (CLANS3 ~1%).
    pub fn maybe_mutate_copy(&mut self, source: u32, chance_percent: f64, rng: &mut Rng) -> u32 {
        // CLANS3: freeGNPointer < TOTAL_GENOME_COUNT - 1000  ⇒  more than 1000 free slots.
        if self.available() < 1000 {
            return source;
        }
        if rng::random_percent(rng) > chance_percent {
            return source;
        }

        let g = self.acquire();
        let src_base = source as usize * GENOME_BYTES;
        let dst_base = g as usize * GENOME_BYTES;
        for i in 0..GENOME_BYTES {
            self.data[dst_base + i] = self.data[src_base + i];
        }
        let mut_offset = rng::random_floor_usize(rng, GENOME_FLAG_INDEX);
        self.data[dst_base + mut_offset] = rng::random_byte(rng);
        self.mark_used(g);
        self.mutation_counter = self.mutation_counter.wrapping_add(1);
        g
    }
}

impl Default for GenomePool {
    fn default() -> Self {
        Self::new(TOTAL_GENOME_COUNT)
    }
}
