const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Ishaan Nandoskar\\dev\\cic-club\\backend\\routes\\compiler_new.js', 'utf8');

const newJava = `Java: \`// Write your solution inside Solution class.
// The judge calls: Solution.solve(arg1, arg2, ...)
// Return your answer — do NOT print/use stdin.
// Example: for input [[2,7,11,15], 9] → solve([2,7,11,15], 9)

public class Solution {
    public static int[] solve(int[] nums, int target) {
        // Write your solution here
        Map<Integer,Integer> seen = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
\`,`;

const fixed = content.replace(/Java: [\s\S]*?(?=\s*C: `)/, newJava);
fs.writeFileSync('C:\\Users\\Ishaan Nandoskar\\dev\\cic-club\\backend\\routes\\compiler_new.js', fixed);
console.log('Fixed');