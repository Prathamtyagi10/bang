arrival=[0,6,7,11,14,20,25]
service=[2,7,1,9,1,5,2]
wait=[0,0,0,0,0,0,0]
execute=[0,0,0,0,0,0,0]
t=0
idle=0
for i = 1:7
    if (t<arrival(i)) then
        idle=idle+arrival(i)-t
        t=arrival(i)
    end
   
    if (t>arrival(i)) then
        wait(i)=t-arrival(i)
    end
    t=t+service(i)
    execute(i)=t
    
end
disp("waiting time: ")
disp(wait)
disp("turnaround time: ")
disp(execute)
disp("average waiting time: ")
disp(sum(wait)/7)
disp("average arrival; time: ")
disp(sum(arrival)/7)
disp("average service; time: ")
disp(sum(service)/7)
disp("idle time proportion:")
disp(idle/t)
disp(idle)
